const express = require("express");
const { body, param, query } = require("express-validator");
const DepartmentController = require("../controllers/department.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validate } = require("../middleware/validation.middleware");
const { SCOPE_TYPES } = require("../constants/iam");

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

// Every request is authorized against the actor's own active tenant -- tenantId is never
// accepted from the client (body/query/params), so there is no way to view or mutate another
// tenant's departments, including by guessing an id in the URL.
const resolveTenantScope = (req) => ({
  scopeType: SCOPE_TYPES.TENANT,
  tenantId: req.user?.activeTenantId,
});

router.get(
  "/",
  requirePermission("academic.department.view", resolveTenantScope),
  validate([
    query("keyword").optional({ values: "falsy" }).isString(),
    query("page").optional({ values: "falsy" }).isInt({ min: 1 }),
    query("page_size").optional({ values: "falsy" }).isInt({ min: 1, max: 100 }),
  ]),
  DepartmentController.list
);

router.get(
  "/:id",
  requirePermission("academic.department.view", resolveTenantScope),
  validate([param("id").isInt({ min: 1 })]),
  DepartmentController.detail
);

router.post(
  "/",
  requirePermission("academic.department.manage", resolveTenantScope),
  validate([
    body("departmentCode").isString().trim().notEmpty().withMessage("departmentCode is required"),
    body("departmentName").isString().trim().notEmpty().withMessage("departmentName is required"),
  ]),
  DepartmentController.create
);

router.put(
  "/:id",
  requirePermission("academic.department.manage", resolveTenantScope),
  validate([
    param("id").isInt({ min: 1 }),
    body("departmentCode").optional().isString().trim().notEmpty(),
    body("departmentName").optional().isString().trim().notEmpty(),
  ]),
  DepartmentController.update
);

router.delete(
  "/:id",
  requirePermission("academic.department.manage", resolveTenantScope),
  validate([param("id").isInt({ min: 1 })]),
  DepartmentController.remove
);

module.exports = router;
