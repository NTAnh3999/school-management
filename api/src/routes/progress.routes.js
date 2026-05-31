const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ProgressController = require("../controllers/progress.controller");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

// Student routes
router.post(
  "/update",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.STUDENT]),
  validate([
    body("enrollmentId").isInt({ min: 1 }),
    body("lessonId").isInt({ min: 1 }),
    body("status").optional().isIn(["not_started", "in_progress", "completed"]),
    body("timeSpent").optional().isInt({ min: 0 }),
  ]),
  ProgressController.updateProgress
);

router.post(
  "/enrollment/:enrollmentId/recompute",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("enrollmentId").isInt({ min: 1 }),
    body("courseVersionId").optional().isInt({ min: 1 }),
    body("reason").optional().isString(),
  ]),
  ProgressController.recomputeEnrollmentProgress
);

router.get(
  "/enrollment/:enrollmentId/event-logs",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("enrollmentId").isInt({ min: 1 })]),
  ProgressController.getProgressEventLogs
);

router.get(
  "/enrollment/:enrollmentId",
  AuthMiddleware.verifyToken,
  validate([param("enrollmentId").isInt({ min: 1 })]),
  ProgressController.getStudentProgress
);

// Teacher routes
router.get(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("courseId").isInt({ min: 1 })]),
  ProgressController.getTeacherCourseProgress
);

module.exports = router;
