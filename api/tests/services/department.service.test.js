// Unit tests for department.service.js. Models are mocked so these run without a real MySQL
// connection -- see api/src/database/init.mysql.js, which nothing here ever loads.
jest.mock("../../src/models", () => ({
  Department: {
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
  Course: {
    count: jest.fn(),
  },
  IamAuditLog: {
    create: jest.fn(),
  },
}));

const { Department, Course, IamAuditLog } = require("../../src/models");
const DepartmentService = require("../../src/services/department.service");
const { ConflictError, NotFoundError } = require("../../src/utils/error-responses");

const actor = { id: 900 };

// department.model instances mutate their own fields directly (department.department_code = x)
// before .save(); get({ plain: true }) reads off `instance` itself so it reflects those
// mutations, the same way a real Sequelize instance's .get({ plain: true }) would.
const makeDepartmentInstance = (overrides) => {
  const instance = {
    id: 1,
    tenant_id: 10,
    department_code: "GEN",
    department_name: "General",
    created_by: null,
    updated_by: null,
    is_deleted: false,
    ...overrides,
  };
  instance.get = ({ plain } = {}) => {
    if (!plain) return instance;
    const plainData = { ...instance };
    delete plainData.get;
    delete plainData.save;
    return plainData;
  };
  instance.save = jest.fn().mockResolvedValue(undefined);
  return instance;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("department.service create()", () => {
  test("creates a department when the code is unique within the tenant", async () => {
    Department.findOne.mockResolvedValueOnce(null);
    const created = makeDepartmentInstance({ id: 5, tenant_id: 10, department_code: "MATH" });
    Department.create.mockResolvedValueOnce(created);

    const result = await DepartmentService.create(
      { tenantId: 10, departmentCode: "MATH", departmentName: "Mathematics" },
      actor
    );

    expect(Department.findOne).toHaveBeenCalledWith({
      where: { tenant_id: 10, department_code: "MATH" },
    });
    expect(Department.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 10,
        department_code: "MATH",
        department_name: "Mathematics",
        created_by: actor.id,
        updated_by: actor.id,
      })
    );
    expect(IamAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "academic.department.create", tenant_id: 10 })
    );
    expect(result.course_count).toBe(0);
  });

  test("rejects a duplicate department_code within the same tenant", async () => {
    Department.findOne.mockResolvedValueOnce(makeDepartmentInstance({ department_code: "MATH" }));

    await expect(
      DepartmentService.create(
        { tenantId: 10, departmentCode: "MATH", departmentName: "Mathematics (again)" },
        actor
      )
    ).rejects.toBeInstanceOf(ConflictError);

    expect(Department.create).not.toHaveBeenCalled();
  });

  test("allows the same department_code to be reused by a different tenant", async () => {
    // Tenant A: code is free.
    Department.findOne.mockResolvedValueOnce(null);
    Department.create.mockResolvedValueOnce(
      makeDepartmentInstance({ id: 1, tenant_id: 10, department_code: "MATH" })
    );
    await DepartmentService.create(
      { tenantId: 10, departmentCode: "MATH", departmentName: "Mathematics" },
      actor
    );
    expect(Department.findOne).toHaveBeenLastCalledWith({
      where: { tenant_id: 10, department_code: "MATH" },
    });

    // Tenant B: same code, also free -- because the uniqueness check is scoped per tenant_id.
    Department.findOne.mockResolvedValueOnce(null);
    Department.create.mockResolvedValueOnce(
      makeDepartmentInstance({ id: 2, tenant_id: 20, department_code: "MATH" })
    );
    await DepartmentService.create(
      { tenantId: 20, departmentCode: "MATH", departmentName: "Mathematics" },
      actor
    );
    expect(Department.findOne).toHaveBeenLastCalledWith({
      where: { tenant_id: 20, department_code: "MATH" },
    });

    expect(Department.create).toHaveBeenCalledTimes(2);
  });
});

describe("department.service remove()", () => {
  test("blocks deletion when at least one course still references the department", async () => {
    const dept = makeDepartmentInstance({ id: 5, tenant_id: 10 });
    Department.findOne.mockResolvedValueOnce(dept);
    Course.count.mockResolvedValueOnce(3);

    let caught;
    try {
      await DepartmentService.remove(10, 5, actor);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ConflictError);
    expect(caught.details).toEqual(expect.objectContaining({ errorCode: "DEPARTMENT_IN_USE" }));

    expect(dept.save).not.toHaveBeenCalled();
    expect(IamAuditLog.create).not.toHaveBeenCalled();
  });

  test("soft-deletes the department when no course references it", async () => {
    const dept = makeDepartmentInstance({ id: 5, tenant_id: 10, is_deleted: false });
    Department.findOne.mockResolvedValueOnce(dept);
    Course.count.mockResolvedValueOnce(0);

    const result = await DepartmentService.remove(10, 5, actor);

    expect(result).toBe(true);
    expect(dept.is_deleted).toBe(true);
    expect(dept.updated_by).toBe(actor.id);
    expect(dept.save).toHaveBeenCalledTimes(1);
    expect(IamAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "academic.department.delete", tenant_id: 10 })
    );
  });
});

describe("department.service tenant isolation", () => {
  test("detail() 404s for an id that belongs to a different tenant", async () => {
    // The department with id=5 really belongs to tenant 99, but tenant 10's admin requests it --
    // the query is scoped by {id, tenant_id: 10}, so it legitimately finds nothing.
    Department.findOne.mockResolvedValueOnce(null);

    await expect(DepartmentService.detail(10, 5)).rejects.toBeInstanceOf(NotFoundError);
    expect(Department.findOne).toHaveBeenCalledWith({ where: { id: 5, tenant_id: 10 } });
  });

  test("update() 404s for a department outside the actor's tenant instead of leaking it", async () => {
    Department.findOne.mockResolvedValueOnce(null);

    await expect(
      DepartmentService.update(10, 5, { departmentName: "Hacked" }, actor)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(Department.findOne).toHaveBeenCalledWith({ where: { id: 5, tenant_id: 10 } });
  });

  test("remove() 404s for a department outside the actor's tenant instead of leaking it", async () => {
    Department.findOne.mockResolvedValueOnce(null);

    await expect(DepartmentService.remove(10, 5, actor)).rejects.toBeInstanceOf(NotFoundError);
    expect(Course.count).not.toHaveBeenCalled();
  });
});
