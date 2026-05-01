const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const LearningItemService = require("../services/learning-item.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const item = await LearningItemService.create(
    req.params.lessonId,
    req.body,
    req.user.id,
    req.user.role
  );
  return new CreatedResponse({ message: "Learning item created", metadata: { item } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const items = await LearningItemService.list(req.params.lessonId);
  return new OKResponse({ metadata: { items } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const item = await LearningItemService.detail(req.params.id);
  return new OKResponse({ metadata: { item } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const item = await LearningItemService.update(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Learning item updated", metadata: { item } }).send(res);
});

const archive = asyncHandler(async (req, res) => {
  const item = await LearningItemService.archive(req.params.id, req.user.id, req.user.role);
  return new OKResponse({ message: "Learning item archived", metadata: { item } }).send(res);
});

const reorder = asyncHandler(async (req, res) => {
  const items = await LearningItemService.reorder(
    req.params.lessonId,
    req.body.orderedIds,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Learning items reordered", metadata: { items } }).send(res);
});

module.exports = { create, list, detail, update, archive, reorder };
