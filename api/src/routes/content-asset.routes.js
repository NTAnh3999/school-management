const express = require("express");
const multer = require("multer");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { SCOPE_TYPES } = require("../constants/iam");
const ContentAssetController = require("../controllers/content-asset.controller");

// Buffered in memory then written to disk by the service (see content-asset.service.js's
// UPLOAD_DIR note on why local disk, not real object storage). 50MB covers the FSD 5.4's largest
// suggested size (Document ≤50MB); per-item-type limits aren't enforced at this layer.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const resolveTenantScope = (req) => ({
  scopeType: SCOPE_TYPES.TENANT,
  tenantId: req.user?.activeTenantId,
});

router.get(
  "/",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScope),
  validate([
    query("mediaType").optional().isString(),
    query("uploadedBy").optional().isInt({ min: 1 }),
  ]),
  ContentAssetController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScope),
  validate([param("id").isInt({ min: 1 })]),
  ContentAssetController.detail
);

// Register asset metadata (actual file upload handled by object storage client-side)
router.post(
  "/",
  AuthMiddleware.verifyToken,
  requirePermission("content.asset.manage", resolveTenantScope),
  validate([
    body("filename").isString().notEmpty(),
    body("mediaType").isString().notEmpty(),
    body("mimeType").isString().notEmpty(),
    body("storageKey").isString().notEmpty(),
    body("sizeBytes").optional().isInt({ min: 0 }),
    body("durationSeconds").optional().isInt({ min: 0 }),
    body("thumbnailUrl").optional().isURL(),
  ]),
  ContentAssetController.create
);

// Upload a file directly (multipart/form-data) -- registers the resulting ContentAsset in one
// step, saving the author from having to first upload elsewhere and paste a storageKey.
router.post(
  "/upload",
  AuthMiddleware.verifyToken,
  requirePermission("content.asset.manage", resolveTenantScope),
  upload.single("file"),
  validate([body("thumbnailUrl").optional().isURL()]),
  ContentAssetController.upload
);

router.patch(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.asset.manage", resolveTenantScope),
  validate([
    param("id").isInt({ min: 1 }),
    body("filename").optional().isString().notEmpty(),
    body("thumbnailUrl").optional().isURL(),
  ]),
  ContentAssetController.update
);

// Metadata-only readiness signal -- this module never uploads/transcodes; an external pipeline
// (or, in this codebase's current no-pipeline state, the client) PATCHes this once ready.
router.patch(
  "/:id/processing-status",
  AuthMiddleware.verifyToken,
  requirePermission("content.asset.manage", resolveTenantScope),
  validate([
    param("id").isInt({ min: 1 }),
    body("processingStatus").isIn(["pending", "processing", "ready", "failed"]),
    body("checksum").optional().isString(),
  ]),
  ContentAssetController.updateProcessingStatus
);

module.exports = router;
