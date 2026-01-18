const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const CourseService = require("../services/course.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const course = await CourseService.create({
    name: req.body?.name,
    description: req.body?.description,
    startDate: req.body?.startDate,
    endDate: req.body?.endDate,
    teacherId: req.body?.teacherId,
  });
  return new CreatedResponse({ message: "Course created", metadata: { course } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const courses = await CourseService.list();
  return new OKResponse({ metadata: { courses } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const course = await CourseService.detail(req.params.id);
  return new OKResponse({ metadata: { course } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const course = await CourseService.update(req.params.id, {
    name: req.body?.name,
    description: req.body?.description,
    startDate: req.body?.startDate,
    endDate: req.body?.endDate,
    teacherId: req.body?.teacherId,
  });
  return new OKResponse({ message: "Course updated", metadata: { course } }).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await CourseService.remove(req.params.id);
  return new OKResponse({ message: "Course deleted" }).send(res);
});

module.exports = { create, list, detail, update, remove };
