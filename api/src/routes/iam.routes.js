const express = require("express");
const { body, query } = require("express-validator");
const IamController = require("../controllers/iam.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validate } = require("../middleware/validation.middleware");
const {
  getMembershipScope,
  resolveSessionTargetScopes,
  resolveUserTenantScopes,
} = require("../services/iam.service");
const { SCOPE_TYPES } = require("../constants/iam");

const router = express.Router();

// The scope being GRANTED, for POST /memberships and POST /users -- checked against the
// actor's own granting role assignment scope, so e.g. a branch-scoped admin can't hand out
// a tenant-wide or different-branch membership. tenantId is included too: without it, an
// actor could grant a membership under a DIFFERENT tenant than the one they're operating in
// (authorizeAccess denies outright on a tenantId mismatch, regardless of scope_type).
const resolveRequestedGrantScope = (req) => ({
  scopeType: req.body?.scopeType || SCOPE_TYPES.TENANT,
  tenantId: req.body?.tenantId || req.user?.activeTenantId || null,
  branchId: req.body?.branchId || null,
  campusId: req.body?.campusId || null,
  locationId: req.body?.locationId || null,
});

// The scope of an EXISTING membership, for PATCH/DELETE /memberships/:id.
const resolveExistingMembershipScope = (req) => getMembershipScope(req.params.id);

// A target user can hold memberships at several different scopes at once (e.g. tenant-wide
// AND a specific branch) -- updateUser() propagates a role change to ALL of them, so every
// one of the target's existing scopes (within the actor's own active tenant) must be covered.
const resolveUserUpdateScopes = (req) =>
  resolveUserTenantScopes(Number(req.params.id), req.user.activeTenantId);

// Revoking a session affects its owner -- same "cover every scope they hold" reasoning as
// updating that user directly.
const resolveSessionRevokeScopes = (req) =>
  resolveSessionTargetScopes(
    { sessionId: req.body?.sessionId, refreshToken: req.body?.refreshToken },
    req.user.activeTenantId
  );

router.use(AuthMiddleware.verifyToken);

router.get("/users", requirePermission("iam.user.view"), IamController.listUsers);
router.post(
  "/users",
  requirePermission("iam.user.manage", resolveRequestedGrantScope),
  validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName").isString().notEmpty().withMessage("fullName is required"),
    body("tenantId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("tenantId must be a positive integer"),
  ]),
  IamController.createUser
);
router.patch(
  "/users/:id",
  requirePermission("iam.user.manage", resolveUserUpdateScopes),
  validate([body("email").optional().isEmail().withMessage("Invalid email")]),
  IamController.updateUser
);

router.post(
  "/memberships",
  requirePermission("iam.membership.manage", resolveRequestedGrantScope),
  validate([
    body("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer"),
    body("tenantId").isInt({ min: 1 }).withMessage("tenantId must be a positive integer"),
  ]),
  IamController.createMembership
);
router.patch(
  "/memberships/:id",
  requirePermission("iam.membership.manage", resolveExistingMembershipScope),
  IamController.updateMembership
);
router.delete(
  "/memberships/:id",
  requirePermission("iam.membership.manage", resolveExistingMembershipScope),
  IamController.deleteMembership
);

router.get("/roles", requirePermission("iam.role.view"), IamController.listRoles);
router.post(
  "/roles",
  requirePermission("iam.role.manage"),
  validate([body("name").isString().notEmpty().withMessage("name is required")]),
  IamController.createRole
);
router.patch("/roles/:id", requirePermission("iam.role.manage"), IamController.updateRole);

router.get("/permissions", requirePermission("iam.permission.view"), IamController.listPermissions);
router.post(
  "/role-permissions",
  requirePermission("iam.permission.manage"),
  validate([body("roleId").isInt({ min: 1 }).withMessage("roleId must be a positive integer")]),
  IamController.addRolePermission
);
router.delete(
  "/role-permissions",
  requirePermission("iam.permission.manage"),
  validate([body("roleId").isInt({ min: 1 }).withMessage("roleId must be a positive integer")]),
  IamController.removeRolePermission
);

router.post("/authorize", requirePermission("iam.authorize"), IamController.authorize);
router.post(
  "/sessions/revoke",
  requirePermission("iam.session.revoke", resolveSessionRevokeScopes),
  IamController.revokeSession
);
router.get(
  "/audit-logs",
  requirePermission("iam.audit.view"),
  validate([
    query("actorUserId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("actorUserId must be a positive integer"),
  ]),
  IamController.listAuditLogs
);

module.exports = router;
