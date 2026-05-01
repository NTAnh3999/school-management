const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ContentAssetController = require("../controllers/content-asset.controller");
const { STAFF_ROLES } = require("../constants/roles");

router.get(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    query("mediaType").optional().isString(),
    query("uploadedBy").optional().isInt({ min: 1 }),
  ]),
  ContentAssetController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  ContentAssetController.detail
);

// Register asset metadata (actual file upload handled by object storage client-side)
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
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

router.patch(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("filename").optional().isString().notEmpty(),
    body("thumbnailUrl").optional().isURL(),
  ]),
  ContentAssetController.update
);

module.exports = router;
