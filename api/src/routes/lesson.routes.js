const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const LessonController = require("../controllers/lesson.controller");
const { ROLES } = require("../constants/roles");

// Get lessons for a module
router.get(
  "/module/:moduleId",
  validate([param("moduleId").isInt({ min: 1 })]),
  LessonController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  LessonController.detail
);

// Admin routes
router.post(
  "/module/:moduleId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("moduleId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("lessonSummary").optional().isString(),
    body("content").optional().isString(),
    body("lessonType").optional().isIn(["Standard", "Microlearning", "QuizOnly"]),
    body("videoUrl").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  LessonController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("lessonSummary").optional().isString(),
    body("content").optional().isString(),
    body("lessonType").optional().isIn(["Standard", "Microlearning", "QuizOnly"]),
    body("videoUrl").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  LessonController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.remove
);

router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.archive
);

module.exports = router;
