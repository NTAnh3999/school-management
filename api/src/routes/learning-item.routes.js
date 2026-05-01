const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const LearningItemController = require("../controllers/learning-item.controller");
const { STAFF_ROLES } = require("../constants/roles");

// List learning items for a lesson (authoring roles only for draft)
router.get(
  "/lesson/:lessonId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("lessonId").isInt({ min: 1 })]),
  LearningItemController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  LearningItemController.detail
);

// Create learning item in a lesson
router.post(
  "/lesson/:lessonId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("lessonId").isInt({ min: 1 }),
    body("itemType").isString().notEmpty(),
    body("title").isString().notEmpty(),
    body("contentPayload").optional().isObject(),
    body("assetId").optional().isInt({ min: 1 }),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("estimatedDuration").optional().isFloat({ min: 0 }),
    body("isRequired").optional().isBoolean(),
  ]),
  LearningItemController.create
);

// Update learning item
router.patch(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("contentPayload").optional().isObject(),
    body("assetId").optional().isInt({ min: 1 }),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("estimatedDuration").optional().isFloat({ min: 0 }),
    body("isRequired").optional().isBoolean(),
  ]),
  LearningItemController.update
);

// Archive learning item (Admin only)
router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  LearningItemController.archive
);

// Reorder learning items within a lesson
router.patch(
  "/lesson/:lessonId/reorder",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("lessonId").isInt({ min: 1 }), body("orderedIds").isArray({ min: 1 })]),
  LearningItemController.reorder
);

module.exports = router;
