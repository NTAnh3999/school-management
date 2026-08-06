const { Op } = require("sequelize");
const { BadRequestError, NotFoundError, ConflictError } = require("../utils/error-responses");
const { Department, Course, IamAuditLog } = require("../models");

const toPlain = (instance) =>
  instance && typeof instance.get === "function" ? instance.get({ plain: true }) : instance;

const recordAuditLog = async ({ actorUserId, tenantId, action, entityId, details }) => {
  return IamAuditLog.create({
    actor_user_id: actorUserId,
    tenant_id: tenantId,
    action,
    entity_type: "department",
    entity_id: entityId ? String(entityId) : null,
    status: "success",
    details,
  });
};

// Departments belong to exactly one tenant -- tenantId always comes from the caller's
// activeTenantId (see department.routes.js), never from the request body, so a request can
// never read or mutate another tenant's departments even by guessing an id in the URL.
const findTenantDepartment = async (tenantId, id) => {
  const department = await Department.findOne({ where: { id, tenant_id: tenantId } });
  if (!department) throw new NotFoundError("Department not found");
  return department;
};

// ---------------------------------------------------------------------------
// ADM-46: List
// ---------------------------------------------------------------------------
const list = async ({ tenantId, keyword, page, page_size } = {}) => {
  const where = { tenant_id: tenantId };
  if (keyword) {
    where[Op.or] = [
      { department_name: { [Op.like]: `%${keyword}%` } },
      { department_code: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const limit = Math.min(parseInt(page_size) || 20, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await Department.findAndCountAll({
    where,
    limit,
    offset,
    order: [["department_name", "ASC"]],
  });

  const departments = await Promise.all(
    rows.map(async (row) => {
      const courseCount = await Course.count({ where: { department_id: row.id } });
      return { ...toPlain(row), course_count: courseCount };
    })
  );

  return { total: count, page: parseInt(page) || 1, page_size: limit, departments };
};

// ---------------------------------------------------------------------------
// ADM-47: Detail
// ---------------------------------------------------------------------------
const detail = async (tenantId, id) => {
  const department = await findTenantDepartment(tenantId, id);
  const courseCount = await Course.count({ where: { department_id: department.id } });
  return { ...toPlain(department), course_count: courseCount };
};

// ---------------------------------------------------------------------------
// ADM-47: Create
// ---------------------------------------------------------------------------
const create = async ({ tenantId, departmentCode, departmentName }, actor) => {
  if (!tenantId) throw new BadRequestError("Tenant context is required");
  if (!departmentCode || !String(departmentCode).trim()) {
    throw new BadRequestError("departmentCode is required");
  }
  if (!departmentName || !String(departmentName).trim()) {
    throw new BadRequestError("departmentName is required");
  }

  const code = String(departmentCode).trim();

  const existing = await Department.findOne({
    where: { tenant_id: tenantId, department_code: code },
  });
  if (existing) throw new ConflictError(`Department code '${code}' already exists for this tenant`);

  const department = await Department.create({
    tenant_id: tenantId,
    department_code: code,
    department_name: String(departmentName).trim(),
    created_by: actor.id,
    updated_by: actor.id,
  });

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId,
    action: "academic.department.create",
    entityId: department.id,
    details: { after: toPlain(department) },
  });

  return { ...toPlain(department), course_count: 0 };
};

// ---------------------------------------------------------------------------
// ADM-47: Update
// ---------------------------------------------------------------------------
const update = async (tenantId, id, payload, actor) => {
  const department = await findTenantDepartment(tenantId, id);
  const before = toPlain(department);

  if (payload.departmentCode !== undefined) {
    const code = String(payload.departmentCode).trim();
    if (!code) throw new BadRequestError("departmentCode cannot be empty");
    if (code !== department.department_code) {
      const dup = await Department.findOne({
        where: { tenant_id: tenantId, department_code: code, id: { [Op.ne]: department.id } },
      });
      if (dup) throw new ConflictError(`Department code '${code}' already exists for this tenant`);
    }
    department.department_code = code;
  }

  if (payload.departmentName !== undefined) {
    const name = String(payload.departmentName).trim();
    if (!name) throw new BadRequestError("departmentName cannot be empty");
    department.department_name = name;
  }

  department.updated_by = actor.id;
  await department.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId,
    action: "academic.department.update",
    entityId: department.id,
    details: { before, after: toPlain(department) },
  });

  const courseCount = await Course.count({ where: { department_id: department.id } });
  return { ...toPlain(department), course_count: courseCount };
};

// ---------------------------------------------------------------------------
// ADM-46: Delete (soft delete, blocked while referenced by any course)
// ---------------------------------------------------------------------------
const remove = async (tenantId, id, actor) => {
  const department = await findTenantDepartment(tenantId, id);

  const courseCount = await Course.count({ where: { department_id: department.id } });
  if (courseCount > 0) {
    throw new ConflictError(
      `Cannot delete department: ${courseCount} course(s) still reference it`,
      { errorCode: "DEPARTMENT_IN_USE" }
    );
  }

  const before = toPlain(department);
  department.is_deleted = true;
  department.updated_by = actor.id;
  await department.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId,
    action: "academic.department.delete",
    entityId: department.id,
    details: { before },
  });

  return true;
};

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
};
