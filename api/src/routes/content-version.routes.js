const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ContentVersionController = require("../controllers/content-version.controller");
const { STAFF_ROLES, ROLES } = require("../constants/roles");

// CCA-API-13: Published content structure (for downstream systems - authenticated)
router.get(
  "/courses/:courseId/published",
  AuthMiddleware.verifyToken,
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.getPublishedStructure
);

// CCA-11: Preview draft structure (authoring roles)
router.get(
  "/courses/:courseId/preview",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.previewDraft
);

// CCA-API-12 + CCA-API-10: List and create versions for a course
router.get(
  "/courses/:courseId/versions",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.list
);

router.post(
  "/courses/:courseId/versions",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("versionLabel").isString().notEmpty(),
    body("changelog").optional().isString(),
  ]),
  ContentVersionController.create
);

// CCA-API-12: Get version detail
router.get(
  "/versions/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.detail
);

// CCA-API-11: Publish content version
router.post(
  "/versions/:id/publish",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.publish
);

// CCA-10: Archive content version (Admin only)
router.patch(
  "/versions/:id/archive",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.archive
);

module.exports = router;
