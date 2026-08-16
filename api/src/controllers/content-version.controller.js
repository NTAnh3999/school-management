const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ContentVersionService = require("../services/content-version.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.create(req.params.courseId, req.body, req.user.id);
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

const validate = asyncHandler(async (req, res) => {
  const result = await ContentVersionService.validate(req.params.id);
  return new OKResponse({ metadata: result }).send(res);
});

const submitForReview = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.submitForReview(req.params.id, req.user.id);
  return new OKResponse({ message: "Content version submitted for review", metadata: { version } }).send(
    res
  );
});

const reviewDecision = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.reviewDecision(req.params.id, req.body, req.user.id);
  return new OKResponse({ message: "Review decision recorded", metadata: { version } }).send(res);
});

const publish = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.publish(req.params.id, req.user.id);
  return new OKResponse({ message: "Content version published", metadata: { version } }).send(res);
});

const archive = asyncHandler(async (req, res) => {
  const version = await ContentVersionService.archive(req.params.id, req.user.id);
  return new OKResponse({ message: "Content version archived", metadata: { version } }).send(res);
});

const getPublishedStructure = asyncHandler(async (req, res) => {
  const result = await ContentVersionService.getPublishedStructure(req.params.courseId);
  return new OKResponse({ metadata: result }).send(res);
});

const previewDraft = asyncHandler(async (req, res) => {
  const result = await ContentVersionService.previewDraft(req.params.courseId);
  return new OKResponse({ metadata: result }).send(res);
});

module.exports = {
  create,
  list,
  detail,
  validate,
  submitForReview,
  reviewDecision,
  publish,
  archive,
  getPublishedStructure,
  previewDraft,
};
