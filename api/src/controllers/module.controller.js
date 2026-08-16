const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ModuleService = require("../services/module.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const courseModule = await ModuleService.create(req.params.versionId, req.body, req.user.id);
  return new CreatedResponse({
    message: "Module created",
    metadata: { module: courseModule },
  }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const modules = await ModuleService.list(req.params.courseId);
  return new OKResponse({ metadata: { modules } }).send(res);
});

const listByVersion = asyncHandler(async (req, res) => {
  const modules = await ModuleService.listByVersion(req.params.versionId);
  return new OKResponse({ metadata: { modules } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const courseModule = await ModuleService.detail(req.params.id);
  return new OKResponse({ metadata: { module: courseModule } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const courseModule = await ModuleService.update(req.params.id, req.body, req.user.id);
  return new OKResponse({ message: "Module updated", metadata: { module: courseModule } }).send(
    res
  );
});

const remove = asyncHandler(async (req, res) => {
  await ModuleService.remove(req.params.id);
  return new OKResponse({ message: "Module deleted" }).send(res);
});

const archive = asyncHandler(async (req, res) => {
  const courseModule = await ModuleService.archive(req.params.id, req.user.id);
  return new OKResponse({ message: "Module archived", metadata: { module: courseModule } }).send(
    res
  );
});

const reorder = asyncHandler(async (req, res) => {
  const modules = await ModuleService.reorder(req.params.versionId, req.body.orderedIds, req.user.id);
  return new OKResponse({ message: "Modules reordered", metadata: { modules } }).send(res);
});

module.exports = { create, list, listByVersion, detail, update, remove, archive, reorder };
