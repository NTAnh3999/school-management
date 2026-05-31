const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ModuleController = require("../controllers/module.controller");
const { ROLES } = require("../constants/roles");

// Get modules for a course
router.get(
  "/course/:courseId",
  validate([param("courseId").isInt({ min: 1 })]),
  ModuleController.list
);

router.get("/:id", validate([param("id").isInt({ min: 1 })]), ModuleController.detail);

// Admin routes
router.post(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  ModuleController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  ModuleController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ModuleController.remove
);

router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ModuleController.archive
);

router.patch(
  "/course/:courseId/reorder",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("courseId").isInt({ min: 1 }), body("orderedIds").isArray({ min: 1 })]),
  ModuleController.reorder
);

module.exports = router;
