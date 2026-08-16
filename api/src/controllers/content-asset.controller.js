const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ContentAssetService = require("../services/content-asset.service");
const asyncHandler = require("../utils/async-handler");

const create = asyncHandler(async (req, res) => {
  const asset = await ContentAssetService.create(req.body, req.user.id, req.user.activeTenantId);
  return new CreatedResponse({ message: "Content asset created", metadata: { asset } }).send(res);
});

const list = asyncHandler(async (req, res) => {
  const assets = await ContentAssetService.list({
    mediaType: req.query.mediaType,
    uploadedBy: req.query.uploadedBy ? Number(req.query.uploadedBy) : undefined,
  });
  return new OKResponse({ metadata: { assets } }).send(res);
});

const detail = asyncHandler(async (req, res) => {
  const asset = await ContentAssetService.detail(req.params.id);
  return new OKResponse({ metadata: { asset } }).send(res);
});

const update = asyncHandler(async (req, res) => {
  const asset = await ContentAssetService.update(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );
  return new OKResponse({ message: "Content asset updated", metadata: { asset } }).send(res);
});

const updateProcessingStatus = asyncHandler(async (req, res) => {
  const asset = await ContentAssetService.updateProcessingStatus(req.params.id, req.body, req.user.id);
  return new OKResponse({ message: "Asset processing status updated", metadata: { asset } }).send(
    res
  );
});

module.exports = { create, list, detail, update, updateProcessingStatus };
