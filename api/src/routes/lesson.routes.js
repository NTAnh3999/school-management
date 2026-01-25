const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const LessonController = require("../controllers/lesson.controller");

// Get lessons for a section
router.get(
  "/section/:sectionId",
  validate([param("sectionId").isInt({ min: 1 })]),
  LessonController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  LessonController.detail
);

// Instructor/Admin routes
router.post(
  "/section/:sectionId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("sectionId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("content").optional().isString(),
    body("lessonType").optional().isIn(["video", "text", "quiz", "assignment"]),
    body("videoUrl").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("orderIndex").optional().isInt({ min: 0 }),
  ]),
  LessonController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("content").optional().isString(),
    body("lessonType").optional().isIn(["video", "text", "quiz", "assignment"]),
    body("videoUrl").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("orderIndex").optional().isInt({ min: 0 }),
  ]),
  LessonController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.remove
);

module.exports = router;
