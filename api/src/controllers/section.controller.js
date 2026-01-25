const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const SectionService = require("../services/section.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const section = await SectionService.create(
    req.params.courseId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Section created", metadata: { section } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const sections = await SectionService.list(req.params.courseId);
  return new OKResponse({ metadata: { sections } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const section = await SectionService.detail(req.params.id);
  return new OKResponse({ metadata: { section } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const section = await SectionService.update(req.params.id, req.body, req.user.id, req.user.role);
  return new OKResponse({ message: "Section updated", metadata: { section } }).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await SectionService.remove(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Section deleted" }).send(res);
});

module.exports = { create, list, detail, update, remove };
