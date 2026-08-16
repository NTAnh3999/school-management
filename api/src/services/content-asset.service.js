const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { ContentAsset, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");
const { CONTENT_ASSET_PROCESSING_STATUSES, CONTENT_ERROR_CODES } = require("../constants/content");
const { emitContentEvent } = require("../utils/content-outbox");

const VALID_MEDIA_TYPES = ["video", "image", "document", "audio"];

const create = async (payload, userId, tenantId) => {
  const { filename, mediaType, mimeType, sizeBytes, durationSeconds, storageKey, thumbnailUrl } =
    payload;

  if (!filename) throw new BadRequestError("filename is required");
  if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) {
    throw new BadRequestError(
      `Invalid media_type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
    );
  }
  if (!mimeType) throw new BadRequestError("mime_type is required");
  if (!storageKey) throw new BadRequestError("storage_key is required");

  const asset = await ContentAsset.create({
    tenant_id: tenantId || null,
    filename,
    media_type: mediaType,
    mime_type: mimeType,
    size_bytes: sizeBytes || null,
    duration_seconds: durationSeconds || null,
    storage_key: storageKey,
    thumbnail_url: thumbnailUrl || null,
    processing_status: CONTENT_ASSET_PROCESSING_STATUSES.PENDING,
    uploaded_by: userId,
    uploaded_at: new Date(),
  });

  await AuditLog.create({
    entity_name: "ContentAsset",
    entity_id: asset.id,
    action: "CREATE",
    new_values: { filename, mediaType, mimeType },
    changed_by: userId,
    source: "api",
  });

  return asset;
};

const list = async ({ mediaType, uploadedBy } = {}) => {
  const where = {};
  if (mediaType) where.media_type = mediaType;
  if (uploadedBy) where.uploaded_by = uploadedBy;

  return ContentAsset.findAll({ where, order: [["uploaded_at", "DESC"]] });
};

const detail = async (id) => {
  const asset = await ContentAsset.findByPk(id);
  if (!asset) throw new NotFoundError("Content asset not found");
  return asset;
};

const update = async (id, payload, userId, userRole) => {
  const asset = await ContentAsset.findByPk(id);
  if (!asset) throw new NotFoundError("Content asset not found");

  if (!isRole(userRole, ROLES.ADMIN) && asset.uploaded_by !== userId) {
    throw new ForbiddenError("Not authorized to update this asset");
  }

  asset.filename = payload.filename ?? asset.filename;
  asset.thumbnail_url = payload.thumbnailUrl ?? asset.thumbnail_url;
  await asset.save();

  return asset;
};

const updateProcessingStatus = async (id, { processingStatus, checksum }, userId) => {
  const asset = await ContentAsset.findByPk(id);
  if (!asset) throw new NotFoundError("Content asset not found");

  if (!Object.values(CONTENT_ASSET_PROCESSING_STATUSES).includes(processingStatus)) {
    throw new BadRequestError(
      `Invalid processing_status. Must be one of: ${Object.values(CONTENT_ASSET_PROCESSING_STATUSES).join(", ")}`
    );
  }

  const previousStatus = asset.processing_status;
  asset.processing_status = processingStatus;
  if (checksum) asset.checksum = checksum;
  await asset.save();

  await AuditLog.create({
    entity_name: "ContentAsset",
    entity_id: asset.id,
    action: "CHANGE_STATUS",
    old_values: { processingStatus: previousStatus },
    new_values: { processingStatus },
    changed_by: userId,
    source: "api",
  });

  await emitContentEvent({
    eventType: "ContentAssetStatusChanged",
    tenantId: asset.tenant_id,
    contentAssetId: asset.id,
    previousStatus,
    currentStatus: processingStatus,
  });

  return asset;
};

module.exports = { create, list, detail, update, updateProcessingStatus };
