const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const LessonService = require("../services/lesson.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const lesson = await LessonService.create(
    req.params.sectionId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Lesson created", metadata: { lesson } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const lessons = await LessonService.list(req.params.sectionId);
  return new OKResponse({ metadata: { lessons } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const lesson = await LessonService.detail(req.params.id);
  return new OKResponse({ metadata: { lesson } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const lesson = await LessonService.update(req.params.id, req.body, req.user.id, req.user.role);
  return new OKResponse({ message: "Lesson updated", metadata: { lesson } }).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await LessonService.remove(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Lesson deleted" }).send(res);
});

module.exports = { create, list, detail, update, remove };
