const { CreatedResponse, OKResponse } = require("../utils/success-responses");
const asyncHandler = require("../utils/async-handler");
const DepartmentService = require("../services/department.service");

// ADM-46: List
const list = asyncHandler(async (req, res) => {
  const result = await DepartmentService.list({
    tenantId: req.user.activeTenantId,
    keyword: req.query.keyword,
    page: req.query.page,
    page_size: req.query.page_size,
  });
  return new OKResponse({ message: "Departments", metadata: result }).send(res);
});

// ADM-47: Detail
const detail = asyncHandler(async (req, res) => {
  const department = await DepartmentService.detail(req.user.activeTenantId, Number(req.params.id));
  return new OKResponse({ metadata: { department } }).send(res);
});

// ADM-47: Create
const create = asyncHandler(async (req, res) => {
  const department = await DepartmentService.create(
    { tenantId: req.user.activeTenantId, ...(req.body || {}) },
    req.user
  );
  return new CreatedResponse({ message: "Department created", metadata: { department } }).send(res);
});

// ADM-47: Update
const update = asyncHandler(async (req, res) => {
  const department = await DepartmentService.update(
    req.user.activeTenantId,
    Number(req.params.id),
    req.body || {},
    req.user
  );
  return new OKResponse({ message: "Department updated", metadata: { department } }).send(res);
});

// ADM-46: Delete (soft, blocked while referenced by a course)
const remove = asyncHandler(async (req, res) => {
  await DepartmentService.remove(req.user.activeTenantId, Number(req.params.id), req.user);
  return new OKResponse({ message: "Department deleted" }).send(res);
});

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
};
