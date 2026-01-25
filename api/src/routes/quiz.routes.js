const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const QuizController = require("../controllers/quiz.controller");

// Get quiz (students see quiz without correct answers)
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  QuizController.getQuiz
);

// Student routes
router.post(
  "/:quizId/attempts",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([param("quizId").isInt({ min: 1 }), body("enrollmentId").isInt({ min: 1 })]),
  QuizController.startAttempt
);

router.post(
  "/attempts/:attemptId/submit",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([param("attemptId").isInt({ min: 1 }), body("answers").isArray()]),
  QuizController.submitAttempt
);

router.get(
  "/:quizId/attempts",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([param("quizId").isInt({ min: 1 })]),
  QuizController.getAttempts
);

// Instructor/Admin routes
router.post(
  "/lesson/:lessonId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("lessonId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("passingScore").optional().isFloat({ min: 0, max: 100 }),
    body("timeLimitMinutes").optional().isInt({ min: 1 }),
    body("maxAttempts").optional().isInt({ min: 1 }),
  ]),
  QuizController.createQuiz
);

router.post(
  "/:quizId/questions",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("quizId").isInt({ min: 1 }),
    body("questionText").isString().notEmpty(),
    body("questionType").optional().isIn(["single_choice", "multiple_choice", "text"]),
    body("points").optional().isFloat({ min: 0 }),
    body("orderIndex").optional().isInt({ min: 0 }),
    body("options").optional().isArray(),
  ]),
  QuizController.addQuestion
);

module.exports = router;
