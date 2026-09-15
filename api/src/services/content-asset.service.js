const fs = require("fs/promises");
const path = require("path");
const AdmZip = require("adm-zip");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/error-responses");
const { ContentAsset, AuditLog } = require("../models");
const { ROLES, isRole } = require("../constants/roles");
const { CONTENT_ASSET_PROCESSING_STATUSES, CONTENT_ERROR_CODES } = require("../constants/content");
const { emitContentEvent } = require("../utils/content-outbox");

const VALID_MEDIA_TYPES = ["video", "image", "document", "audio", "model3d", "h5p"];

// This module registers ContentAsset metadata; it does not own long-term binary storage/CDN
// delivery (FSD §2.2 Out of Scope — that belongs to a separate Storage/Media module, not yet
// built). Saving to local disk here is a dev-environment stand-in so upload actually works today
// rather than requiring every asset to be registered against a URL the author already has
// elsewhere; swapping this for real object storage later only touches this one function.
const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");
const UPLOAD_URL_PREFIX = "/uploads";

const _mediaTypeFromMime = (mimeType, filename = "") => {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "model/gltf-binary" || mimeType === "model/gltf+json") return "model3d";
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".glb" || ext === ".gltf") return "model3d";
  if (ext === ".h5p") return "h5p";
  return "document";
};

/**
 * Validates an H5P package's entry list contains the minimum structure H5P's own spec requires
 * (root h5p.json manifest + content/content.json) before any extraction happens -- catches a
 * non-H5P zip or a corrupted package with a specific, actionable error rather than silently
 * extracting garbage.
 */
const _validateH5pStructure = (entries) => {
  const entryNames = new Set(entries.map((e) => e.entryName));
  if (!entryNames.has("h5p.json")) {
    throw new BadRequestError(
      "The uploaded file doesn't look like a valid .h5p package (missing root h5p.json)"
    );
  }
  if (!entryNames.has("content/content.json")) {
    throw new BadRequestError(
      "The uploaded file doesn't look like a valid .h5p package (missing content/content.json)"
    );
  }
};

/**
 * Extracts an H5P (.h5p / zip) buffer into destDir, validating every entry's resolved path stays
 * inside destDir BEFORE writing anything -- a malicious entry anywhere in the archive (e.g. a
 * zip-slip "../../etc/passwd" path-traversal payload, or an absolute path) rejects the whole
 * upload with zero filesystem residue left behind. This is deliberate defense-in-depth: adm-zip
 * sanitizes entry names via zipnamefix() when IT creates an archive (addFile), but an uploaded
 * .h5p was built by whatever tool the author used -- possibly not adm-zip at all -- so a raw,
 * unsanitized traversal entry name can genuinely reach getEntries() here; this guard is what
 * actually stops it, confirmed by hand-crafting a raw ZIP (bypassing adm-zip's own write-time
 * sanitization entirely) and verifying this code rejects it with nothing written to disk.
 */
const _extractZipEntriesSafely = async (buffer, destDir) => {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  if (entries.length === 0) {
    throw new BadRequestError("The uploaded .h5p package is empty or not a valid zip archive");
  }

  _validateH5pStructure(entries);

  const totalUncompressedSize = entries.reduce((sum, e) => sum + (e.header?.size || 0), 0);
  const MAX_H5P_UNCOMPRESSED_SIZE = 500 * 1024 * 1024; // generous sanity ceiling, not a real limit
  if (totalUncompressedSize > MAX_H5P_UNCOMPRESSED_SIZE) {
    throw new BadRequestError("The uploaded .h5p package is too large once decompressed");
  }

  const resolvedDestDir = path.resolve(destDir);

  // Pass 1: validate every entry BEFORE writing anything.
  for (const entry of entries) {
    const resolvedPath = path.resolve(resolvedDestDir, entry.entryName);
    const isInsideDestDir =
      resolvedPath === resolvedDestDir || resolvedPath.startsWith(resolvedDestDir + path.sep);
    if (!isInsideDestDir) {
      throw new BadRequestError(
        `Rejected .h5p upload: archive entry "${entry.entryName}" resolves outside the extraction directory`
      );
    }
  }

  // Pass 2: all entries validated -- now actually write them.
  await fs.mkdir(resolvedDestDir, { recursive: true });
  for (const entry of entries) {
    const resolvedPath = path.resolve(resolvedDestDir, entry.entryName);
    if (entry.isDirectory) {
      await fs.mkdir(resolvedPath, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, entry.getData());
  }
};

const create = async (payload, userId, tenantId) => {
  const { filename, mediaType, mimeType, sizeBytes, durationSeconds, storageKey, thumbnailUrl } =
    payload;

  if (!filename) throw new BadRequestError("filename is required");
  if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) {
    throw new BadRequestError(
      `Invalid media_type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
    );
  }
  if (mediaType === "h5p") {
    throw new BadRequestError(
      "H5P assets must be registered via file upload (POST /content-assets/upload), not manual registration -- an .h5p package needs to be extracted and validated, which the upload endpoint does automatically."
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

/**
 * Registers a ContentAsset from an uploaded file (multer memoryStorage buffer), writing it to
 * local disk and deriving media_type/mime_type/size_bytes from the file itself rather than
 * trusting client-supplied values. processing_status starts "ready" immediately since there's no
 * transcoding pipeline behind this dev-storage stand-in -- the file is already fully usable the
 * moment it's written.
 */
const uploadAndCreate = async (file, payload, userId, tenantId) => {
  if (!file) throw new BadRequestError("file is required");

  const { thumbnailUrl } = payload || {};

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.originalname) || "";
  const mediaType = _mediaTypeFromMime(file.mimetype, file.originalname);

  let storageKey;
  if (mediaType === "h5p") {
    // .h5p files are zip archives -- h5p-standalone (the frontend playback runtime) requires
    // their contents already extracted into a folder served over plain HTTP, not the archive
    // itself, so this branch unzips into UPLOAD_DIR/h5p/{id}/ instead of writing one blob.
    const storedId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const h5pDir = path.join(UPLOAD_DIR, "h5p", storedId);
    await _extractZipEntriesSafely(file.buffer, h5pDir);
    // No trailing slash -- h5p-standalone appends "/h5p.json" itself onto h5pJsonPath without
    // checking for one already present, so a trailing slash here produces a double-slash URL
    // ("...uoi4n4//h5p.json") that 404s/500s. Confirmed by testing with a trailing slash first.
    storageKey = `${UPLOAD_URL_PREFIX}/h5p/${storedId}`;
  } else {
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const diskPath = path.join(UPLOAD_DIR, storedName);
    await fs.writeFile(diskPath, file.buffer);
    storageKey = `${UPLOAD_URL_PREFIX}/${storedName}`;
  }

  const asset = await ContentAsset.create({
    tenant_id: tenantId || null,
    filename: file.originalname,
    media_type: mediaType,
    mime_type: file.mimetype,
    // For h5p, this is the original .h5p archive's size, not the extracted folder's total --
    // the number an author intuitively expects, and the only one available without walking the
    // extracted tree with fs.stat for no consumer that needs it.
    size_bytes: file.size,
    duration_seconds: null,
    storage_key: storageKey,
    thumbnail_url: thumbnailUrl || null,
    processing_status: CONTENT_ASSET_PROCESSING_STATUSES.READY,
    uploaded_by: userId,
    uploaded_at: new Date(),
  });

  await AuditLog.create({
    entity_name: "ContentAsset",
    entity_id: asset.id,
    action: "CREATE",
    new_values: { filename: file.originalname, mediaType, mimeType: file.mimetype },
    changed_by: userId,
    source: "api",
  });

  await emitContentEvent({
    eventType: "ContentAssetStatusChanged",
    tenantId: tenantId || null,
    contentAssetId: asset.id,
    previousStatus: null,
    currentStatus: CONTENT_ASSET_PROCESSING_STATUSES.READY,
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

module.exports = { create, uploadAndCreate, list, detail, update, updateProcessingStatus };
