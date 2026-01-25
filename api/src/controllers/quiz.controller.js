const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const QuizService = require("../services/quiz.service");
const asyncHandler = require("../utils/async-handler");

const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await QuizService.createQuiz(
    req.params.lessonId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Quiz created", metadata: { quiz } }).send(res);
});

const addQuestion = asyncHandler(async (req, res) => {
  const question = await QuizService.addQuestion(
    req.params.quizId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Question added", metadata: { question } }).send(res);
});

const getQuiz = asyncHandler(async (req, res) => {
  const includeAnswers = req.user.role === "admin" || req.user.role === "instructor";
  const quiz = await QuizService.getQuiz(req.params.id, includeAnswers);
  return new OKResponse({ metadata: { quiz } }).send(res);
});

const startAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizService.startAttempt(req.params.quizId, req.body.enrollmentId);
  return new CreatedResponse({ message: "Attempt started", metadata: { attempt } }).send(res);
});

const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizService.submitAttempt(req.params.attemptId, req.body.answers);
  return new OKResponse({ message: "Attempt submitted", metadata: { attempt } }).send(res);
});

const getAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizService.getAttempts(req.body.enrollmentId, req.params.quizId);
  return new OKResponse({ metadata: { attempts } }).send(res);
});

module.exports = { createQuiz, addQuestion, getQuiz, startAttempt, submitAttempt, getAttempts };
