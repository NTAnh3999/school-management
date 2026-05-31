const express = require("express");
const { body, param, query } = require("express-validator");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const { validate } = require("../middleware/validation.middleware");
const AssessmentController = require("../controllers/assessment.controller");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

router.use(AuthMiddleware.verifyToken);

router.get("/", AssessmentController.listAssessments);

router.get(
  "/:id",
  validate([param("id").isInt({ min: 1 })]),
  AssessmentController.getAssessment
);

router.post(
  "/",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    body("title").isString().notEmpty(),
    body("lessonId").isInt({ min: 1 }),
    body("description").optional().isString(),
    body("assessmentType").optional().isIn(["quiz", "assignment", "exam", "survey", "other"]),
    body("classroomId").optional().isInt({ min: 1 }),
    body("openAt").optional().isISO8601(),
    body("closeAt").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1 }),
    body("maxAttempts").optional().isInt({ min: 1 }),
    body("maxScore").optional().isFloat({ min: 0.01 }),
    body("gradingMethod").optional().isIn(["auto", "manual", "hybrid"]),
    body("publishPolicy").optional().isIn(["manual", "auto_after_graded", "scheduled"]),
    body("resultPublishAt").optional().isISO8601(),
    body("questions").optional().isArray(),
  ]),
  AssessmentController.createAssessment
);

router.patch(
  "/:id",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("assessmentType").optional().isIn(["quiz", "assignment", "exam", "survey", "other"]),
    body("openAt").optional().isISO8601(),
    body("closeAt").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1 }),
    body("maxAttempts").optional().isInt({ min: 1 }),
    body("maxScore").optional().isFloat({ min: 0.01 }),
    body("gradingMethod").optional().isIn(["auto", "manual", "hybrid"]),
    body("publishPolicy").optional().isIn(["manual", "auto_after_graded", "scheduled"]),
    body("resultPublishAt").optional().isISO8601(),
    body("passingScore").optional().isFloat({ min: 0, max: 100 }),
  ]),
  AssessmentController.updateAssessment
);

router.post(
  "/:id/publish",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  AssessmentController.publishAssessment
);

router.post(
  "/:id/close",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 }), body("reason").optional().isString()]),
  AssessmentController.closeAssessment
);

router.post(
  "/:id/archive",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 }), body("reason").optional().isString()]),
  AssessmentController.archiveAssessment
);

router.post(
  "/:id/questions",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("questionText").isString().notEmpty(),
    body("questionType").optional().isIn([
      "single_choice",
      "multiple_choice",
      "text",
      "essay",
      "file_upload",
    ]),
    body("points").optional().isFloat({ min: 0 }),
    body("orderIndex").optional().isInt({ min: 0 }),
    body("options").optional().isArray(),
  ]),
  AssessmentController.addQuestion
);

router.post(
  "/:id/attempts",
  RoleMiddleware.requireRole([ROLES.STUDENT]),
  validate([param("id").isInt({ min: 1 }), body("enrollmentId").isInt({ min: 1 })]),
  AssessmentController.startAttempt
);

router.get(
  "/:id/attempts",
  validate([
    param("id").isInt({ min: 1 }),
    query("enrollmentId").optional().isInt({ min: 1 }),
  ]),
  AssessmentController.getAttempts
);

router.post(
  "/attempts/:attemptId/submit",
  RoleMiddleware.requireRole([ROLES.STUDENT]),
  validate([param("attemptId").isInt({ min: 1 }), body("answers").isArray({ min: 1 })]),
  AssessmentController.submitAttempt
);

router.post(
  "/submissions/:submissionId/grade",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("submissionId").isInt({ min: 1 }),
    body("score").isFloat({ min: 0 }),
    body("feedback").optional().isString(),
    body("reason").optional().isString(),
  ]),
  AssessmentController.gradeSubmission
);

router.post(
  "/grades/:gradeId/publish",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("gradeId").isInt({ min: 1 })]),
  AssessmentController.publishGrade
);

router.get(
  "/:id/results",
  validate([param("id").isInt({ min: 1 }), query("studentId").optional().isInt({ min: 1 })]),
  AssessmentController.getResults
);

router.get(
  "/:id/export",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 }), query("studentId").optional().isInt({ min: 1 })]),
  AssessmentController.exportResults
);

router.get(
  "/:id/audit-logs",
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  AssessmentController.getAuditLogs
);

module.exports = router;
