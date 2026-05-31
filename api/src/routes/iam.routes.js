const express = require("express");
const { body, query } = require("express-validator");
const IamController = require("../controllers/iam.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validate } = require("../middleware/validation.middleware");

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

router.get("/users", requirePermission("iam.user.view"), IamController.listUsers);
router.post(
  "/users",
  requirePermission("iam.user.manage"),
  validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isString().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("fullName").isString().notEmpty().withMessage("fullName is required"),
    body("tenantId").optional().isInt({ min: 1 }).withMessage("tenantId must be a positive integer"),
  ]),
  IamController.createUser
);
router.patch(
  "/users/:id",
  requirePermission("iam.user.manage"),
  validate([body("email").optional().isEmail().withMessage("Invalid email")]),
  IamController.updateUser
);

router.post(
  "/memberships",
  requirePermission("iam.membership.manage"),
  validate([
    body("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer"),
    body("tenantId").isInt({ min: 1 }).withMessage("tenantId must be a positive integer"),
  ]),
  IamController.createMembership
);
router.patch(
  "/memberships/:id",
  requirePermission("iam.membership.manage"),
  IamController.updateMembership
);
router.delete(
  "/memberships/:id",
  requirePermission("iam.membership.manage"),
  IamController.deleteMembership
);

router.get("/roles", requirePermission("iam.role.view"), IamController.listRoles);
router.post(
  "/roles",
  requirePermission("iam.role.manage"),
  validate([body("name").isString().notEmpty().withMessage("name is required")]),
  IamController.createRole
);
router.patch(
  "/roles/:id",
  requirePermission("iam.role.manage"),
  IamController.updateRole
);

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
  requirePermission("iam.session.revoke"),
  IamController.revokeSession
);
router.get(
  "/audit-logs",
  requirePermission("iam.audit.view"),
  validate([
    query("tenantId").optional().isInt({ min: 1 }).withMessage("tenantId must be a positive integer"),
    query("actorUserId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("actorUserId must be a positive integer"),
  ]),
  IamController.listAuditLogs
);

module.exports = router;
