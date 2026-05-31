const { OKResponse } = require("../utils/success-responses");
const ProgressService = require("../services/progress.service");
const asyncHandler = require("../utils/async-handler");

const updateProgress = asyncHandler(async (req, res) => {
  const { enrollmentId, lessonId, status, timeSpent } = req.body;
  const progress = await ProgressService.updateProgress(
    enrollmentId,
    lessonId,
    status,
    timeSpent,
    req.user
  );
  return new OKResponse({ message: "Progress updated", metadata: { progress } }).send(res);
});

const getStudentProgress = asyncHandler(async (req, res) => {
  const progress = await ProgressService.getStudentProgress(req.params.enrollmentId, req.user);
  return new OKResponse({ metadata: { progress } }).send(res);
});

const getTeacherCourseProgress = asyncHandler(async (req, res) => {
  const enrollments = await ProgressService.getTeacherCourseProgress(req.params.courseId, req.user);
  return new OKResponse({ metadata: { enrollments } }).send(res);
});

const recomputeEnrollmentProgress = asyncHandler(async (req, res) => {
  const progress = await ProgressService.recomputeEnrollmentProgress(
    req.params.enrollmentId,
    req.user,
    req.body
  );
  return new OKResponse({
    message: "Progress recomputed",
    metadata: { progress },
  }).send(res);
});

const getProgressEventLogs = asyncHandler(async (req, res) => {
  const eventLogs = await ProgressService.getProgressEventLogs(req.params.enrollmentId, req.user);
  return new OKResponse({ metadata: { eventLogs } }).send(res);
});

module.exports = {
  updateProgress,
  getStudentProgress,
  getTeacherCourseProgress,
  recomputeEnrollmentProgress,
  getProgressEventLogs,
};
