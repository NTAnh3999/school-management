const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const CourseService = require("../services/course.service");
const asyncHandler = require("../utils/async-handler");

// COURSE-01: Create
const create = asyncHandler(async (req, res) => {
  const course = await CourseService.create(req.body, req.user.id);
  return new CreatedResponse({ message: "Course created", metadata: { course } }).send(res);
});

// COURSE-00: List
const list = asyncHandler(async (req, res) => {
  const filters = {
    keyword: req.query.keyword,
    status: req.query.status,
    level: req.query.level,
    teacherId: req.query.teacherId,
    departmentId: req.query.departmentId,
    courseType: req.query.courseType,
    page: req.query.page,
    page_size: req.query.page_size,
  };
  const result = await CourseService.list(filters, req.user?.role);
  return new OKResponse({ metadata: result }).send(res);
});

// COURSE-00: Detail
const detail = asyncHandler(async (req, res) => {
  const course = await CourseService.detail(req.params.id, req.user?.role);
  return new OKResponse({ metadata: { course } }).send(res);
});

// COURSE-02: Update
const update = asyncHandler(async (req, res) => {
  const course = await CourseService.update(req.params.id, req.body, req.user.id, req.user.role);
  return new OKResponse({ message: "Course updated", metadata: { course } }).send(res);
});

// COURSE-03: Change Status
const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const course = await CourseService.changeStatus(
    req.params.id,
    status,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Course status updated", metadata: { course } }).send(res);
});

// COURSE-04: Manage Prerequisites
const updatePrerequisites = asyncHandler(async (req, res) => {
  const prerequisites = await CourseService.updatePrerequisites(
    req.params.id,
    req.body.prerequisites,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Prerequisites updated", metadata: { prerequisites } }).send(
    res
  );
});

// COURSE-07: Delete (soft)
const remove = asyncHandler(async (req, res) => {
  await CourseService.remove(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Course deleted" }).send(res);
});

// Enrollment helpers
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

module.exports = {
  create,
  list,
  detail,
  update,
  changeStatus,
  updatePrerequisites,
  remove,
  enroll,
  getEnrollments,
};
