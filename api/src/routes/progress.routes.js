const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ProgressController = require("../controllers/progress.controller");

// Student routes
router.post(
  "/update",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([
    body("enrollmentId").isInt({ min: 1 }),
    body("lessonId").isInt({ min: 1 }),
    body("status").optional().isIn(["not_started", "in_progress", "completed"]),
    body("timeSpent").optional().isInt({ min: 0 }),
  ]),
  ProgressController.updateProgress
);

router.get(
  "/enrollment/:enrollmentId",
  AuthMiddleware.verifyToken,
  validate([param("enrollmentId").isInt({ min: 1 })]),
  ProgressController.getStudentProgress
);

// Instructor routes
router.get(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([param("courseId").isInt({ min: 1 })]),
  ProgressController.getInstructorCourseProgress
);

module.exports = router;
