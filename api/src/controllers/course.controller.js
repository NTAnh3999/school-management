const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const CourseService = require("../services/course.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const course = await CourseService.create({
    title: req.body?.title,
    description: req.body?.description,
    level: req.body?.level,
    price: req.body?.price,
    instructorId: req.user.id, // Use authenticated user
  });
  return new CreatedResponse({ message: "Course created", metadata: { course } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const filters = {
    level: req.query.level,
    status: req.query.status,
    instructorId: req.query.instructorId,
  };
  const courses = await CourseService.list(filters);
  return new OKResponse({ metadata: { courses } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const course = await CourseService.detail(req.params.id);
  return new OKResponse({ metadata: { course } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const course = await CourseService.update(req.params.id, req.body, req.user.id, req.user.role);
  return new OKResponse({ message: "Course updated", metadata: { course } }).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await CourseService.remove(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Course deleted" }).send(res);
});

const enroll = asyncHandler(async (req, res) => {
  const enrollment = await CourseService.enroll(req.params.id, req.user.id);
  return new CreatedResponse({ message: "Enrolled successfully", metadata: { enrollment } }).send(
    res
  );
});

const getEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await CourseService.getEnrollments(req.user.id);
  return new OKResponse({ metadata: { enrollments } }).send(res);
});

module.exports = { create, list, detail, update, remove, enroll, getEnrollments };
