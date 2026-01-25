const { OKResponse } = require("../utils/success-responses");
const ProgressService = require("../services/progress.service");
const asyncHandler = require("../utils/async-handler");

const updateProgress = asyncHandler(async (req, res) => {
  const { enrollmentId, lessonId, status, timeSpent } = req.body;
  const progress = await ProgressService.updateProgress(enrollmentId, lessonId, status, timeSpent);
  return new OKResponse({ message: "Progress updated", metadata: { progress } }).send(res);
});

const getStudentProgress = asyncHandler(async (req, res) => {
  const progress = await ProgressService.getStudentProgress(req.params.enrollmentId);
  return new OKResponse({ metadata: { progress } }).send(res);
});

const getInstructorCourseProgress = asyncHandler(async (req, res) => {
  const enrollments = await ProgressService.getInstructorCourseProgress(req.params.courseId);
  return new OKResponse({ metadata: { enrollments } }).send(res);
});

module.exports = { updateProgress, getStudentProgress, getInstructorCourseProgress };
