const { CreatedResponse, OKResponse } = require("../utils/success-responses");
const asyncHandler = require("../utils/async-handler");
const IamService = require("../services/iam.service");

const listUsers = asyncHandler(async (req, res) => {
  const users = await IamService.listUsers(req.user.id, req.user.activeTenantId);
  return new OKResponse({ message: "IAM users", metadata: { users } }).send(res);
});

const createUser = asyncHandler(async (req, res) => {
  const user = await IamService.createUser(req.body || {}, req.user, req);
  return new CreatedResponse({ message: "IAM user created", metadata: { user } }).send(res);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await IamService.updateUser(Number(req.params.id), req.body || {}, req.user, req);
  return new OKResponse({ message: "IAM user updated", metadata: { user } }).send(res);
});

const createMembership = asyncHandler(async (req, res) => {
  const membership = await IamService.createMembership(req.body || {}, req.user, req);
  return new CreatedResponse({
    message: "Membership assigned",
    metadata: { membership },
  }).send(res);
});

const updateMembership = asyncHandler(async (req, res) => {
  const membership = await IamService.updateMembership(
    Number(req.params.id),
    req.body || {},
    req.user,
    req
  );
  return new OKResponse({ message: "Membership updated", metadata: { membership } }).send(res);
});

const deleteMembership = asyncHandler(async (req, res) => {
  const membership = await IamService.deleteMembership(Number(req.params.id), req.user, req);
  return new OKResponse({ message: "Membership revoked", metadata: { membership } }).send(res);
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await IamService.listRoles();
  return new OKResponse({ message: "IAM roles", metadata: { roles } }).send(res);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await IamService.createRole(req.body || {}, req.user, req);
  return new CreatedResponse({ message: "IAM role created", metadata: { role } }).send(res);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await IamService.updateRole(Number(req.params.id), req.body || {}, req.user, req);
  return new OKResponse({ message: "IAM role updated", metadata: { role } }).send(res);
});

const listPermissions = asyncHandler(async (req, res) => {
  const permissions = await IamService.listPermissions();
  return new OKResponse({ message: "IAM permissions", metadata: { permissions } }).send(res);
});

const addRolePermission = asyncHandler(async (req, res) => {
  const result = await IamService.addRolePermission(req.body || {}, req.user, req);
  return new CreatedResponse({
    message: "Role permission mapped",
    metadata: result,
  }).send(res);
});

const removeRolePermission = asyncHandler(async (req, res) => {
  const result = await IamService.removeRolePermission(req.body || {}, req.user, req);
  return new OKResponse({
    message: "Role permission removed",
    metadata: result,
  }).send(res);
});

const authorize = asyncHandler(async (req, res) => {
  const decision = await IamService.authorizeAccess({
    userId: req.user.id,
    activeTenantId: req.user.activeTenantId,
    requiredPermission: req.body?.requiredPermission,
    requestedScopeType: req.body?.requestedScopeType,
    requestedBranchId: req.body?.requestedBranchId,
    requestedCampusId: req.body?.requestedCampusId,
    requestedLocationId: req.body?.requestedLocationId,
  });
  return new OKResponse({ message: "Authorization decision", metadata: decision }).send(res);
});

const revokeSession = asyncHandler(async (req, res) => {
  const session = await IamService.revokeSession(req.body || {}, req.user, req);
  return new OKResponse({ message: "Session revoked", metadata: { session } }).send(res);
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await IamService.listAuditLogs(
    { actorUserId: req.query?.actorUserId ? Number(req.query.actorUserId) : undefined },
    req.user.id,
    req.user.activeTenantId
  );
  return new OKResponse({ message: "IAM audit logs", metadata: { logs } }).send(res);
});

module.exports = {
  addRolePermission,
  authorize,
  createMembership,
  createRole,
  createUser,
  deleteMembership,
  listAuditLogs,
  listPermissions,
  listRoles,
  listUsers,
  removeRolePermission,
  revokeSession,
  updateMembership,
  updateRole,
  updateUser,
};
