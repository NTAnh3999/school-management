const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ContentVersionService = require("../services/content-version.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.create(
    req.params.courseId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Content version created", metadata: { version } }).send(
    res
  );
});

const list = asyncHandler(async (req, res) => {
  const versions = await ContentVersionService.list(req.params.courseId);
  return new OKResponse({ metadata: { versions } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.detail(req.params.id);
  return new OKResponse({ metadata: { version } }).send(res);
});

const publish = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.publish(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Content version published", metadata: { version } }).send(res);
});

const archive = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.archive(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Content version archived", metadata: { version } }).send(res);
});

const getPublishedStructure = asyncHandler(async (req, res) => {
  const result = await ContentVersionService.getPublishedStructure(req.params.courseId);
  return new OKResponse({ metadata: result }).send(res);
});

const previewDraft = asyncHandler(async (req, res) => {
  const result = await ContentVersionService.previewDraft(
    req.params.courseId,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ metadata: result }).send(res);
});

module.exports = { create, list, detail, publish, archive, getPublishedStructure, previewDraft };
