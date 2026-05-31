"use strict";

const AssessmentService = require("./assessment.service");

const createQuiz = async (lessonId, payload, userId, userRole) =>
  AssessmentService.createAssessment(
    {
      ...payload,
      lessonId,
      assessmentType: "quiz",
      durationMinutes: payload.durationMinutes ?? payload.timeLimitMinutes,
    },
    { id: userId, role: userRole }
  );

const addQuestion = async (quizId, payload, userId, userRole) =>
  AssessmentService.addQuestion(quizId, payload, { id: userId, role: userRole });

const getQuiz = async (quizId, actor) => AssessmentService.getAssessment(quizId, actor);

const startAttempt = async (quizId, enrollmentId, actor) =>
  AssessmentService.startAttempt(quizId, enrollmentId, actor);

const submitAttempt = async (attemptId, answers, actor) =>
  AssessmentService.submitAttempt(attemptId, answers, actor);

const getAttempts = async (enrollmentId, quizId, actor) =>
  AssessmentService.getAttempts(enrollmentId, quizId, actor);

module.exports = {
  addQuestion,
  createQuiz,
  getAttempts,
  getQuiz,
  startAttempt,
  submitAttempt,
};
