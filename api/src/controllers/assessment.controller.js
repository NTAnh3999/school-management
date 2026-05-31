const { CreatedResponse, OKResponse } = require("../utils/success-responses");
const asyncHandler = require("../utils/async-handler");
const AssessmentService = require("../services/assessment.service");

const buildRequestContext = (req) => ({
  requestId: req.id || req.headers["x-request-id"] || null,
  ipAddress: req.ip || null,
  userAgent: req.get("user-agent") || null,
});

const listAssessments = asyncHandler(async (req, res) => {
  const assessments = await AssessmentService.listAssessments(req.query, req.user);
  return new OKResponse({ metadata: { assessments } }).send(res);
});

const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.getAssessment(req.params.id, req.user);
  return new OKResponse({ metadata: { assessment } }).send(res);
});

const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.createAssessment(
    req.body,
    req.user,
    buildRequestContext(req)
  );
  return new CreatedResponse({
    message: "Assessment created",
    metadata: { assessment },
  }).send(res);
});

const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.updateAssessment(
    req.params.id,
    req.body,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Assessment updated",
    metadata: { assessment },
  }).send(res);
});

const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.publishAssessment(
    req.params.id,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Assessment published",
    metadata: { assessment },
  }).send(res);
});

const closeAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.closeAssessment(
    req.params.id,
    req.body.reason,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Assessment closed",
    metadata: { assessment },
  }).send(res);
});

const archiveAssessment = asyncHandler(async (req, res) => {
  const assessment = await AssessmentService.archiveAssessment(
    req.params.id,
    req.body.reason,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Assessment archived",
    metadata: { assessment },
  }).send(res);
});

const addQuestion = asyncHandler(async (req, res) => {
  const question = await AssessmentService.addQuestion(req.params.id, req.body, req.user);
  return new CreatedResponse({
    message: "Question added",
    metadata: { question },
  }).send(res);
});

const startAttempt = asyncHandler(async (req, res) => {
  const attempt = await AssessmentService.startAttempt(
    req.params.id,
    req.body.enrollmentId,
    req.user,
    buildRequestContext(req)
  );
  return new CreatedResponse({
    message: "Attempt started",
    metadata: { attempt },
  }).send(res);
});

const submitAttempt = asyncHandler(async (req, res) => {
  const result = await AssessmentService.submitAttempt(
    req.params.attemptId,
    req.body.answers,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Attempt submitted",
    metadata: result,
  }).send(res);
});

const gradeSubmission = asyncHandler(async (req, res) => {
  const result = await AssessmentService.gradeSubmission(
    req.params.submissionId,
    req.body,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Submission graded",
    metadata: result,
  }).send(res);
});

const publishGrade = asyncHandler(async (req, res) => {
  const result = await AssessmentService.publishGrade(
    req.params.gradeId,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({
    message: "Grade published",
    metadata: result,
  }).send(res);
});

const getAttempts = asyncHandler(async (req, res) => {
  const attempts = await AssessmentService.getAttempts(
    req.query.enrollmentId || req.body.enrollmentId,
    req.params.id,
    req.user
  );
  return new OKResponse({ metadata: { attempts } }).send(res);
});

const getResults = asyncHandler(async (req, res) => {
  const results = await AssessmentService.getAssessmentResults(
    req.params.id,
    req.query,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({ metadata: { results } }).send(res);
});

const exportResults = asyncHandler(async (req, res) => {
  const exportData = await AssessmentService.exportAssessmentResults(
    req.params.id,
    req.query,
    req.user,
    buildRequestContext(req)
  );
  return new OKResponse({ metadata: exportData }).send(res);
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const auditLogs = await AssessmentService.getAssessmentAuditLogs(req.params.id, req.user);
  return new OKResponse({ metadata: { auditLogs } }).send(res);
});

module.exports = {
  addQuestion,
  archiveAssessment,
  closeAssessment,
  createAssessment,
  exportResults,
  getAssessment,
  getAttempts,
  getAuditLogs,
  getResults,
  gradeSubmission,
  listAssessments,
  publishAssessment,
  publishGrade,
  startAttempt,
  submitAttempt,
  updateAssessment,
};
