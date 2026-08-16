const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { requireCourseAuthor } = require("../middleware/course-author.middleware");
const ContentVersionController = require("../controllers/content-version.controller");
const ContentReviewController = require("../controllers/content-review.controller");
const { Course, Department, ContentVersion } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

router.use(AuthMiddleware.verifyToken);

// Every request is authorized against the actor's own active tenant -- tenantId is server-
// derived (course -> department -> tenant), never accepted from the client.
const resolveCourseTenantScopeById = async (courseId) => {
  if (!courseId) return { scopeType: SCOPE_TYPES.TENANT, tenantId: null };
  const course = await Course.findByPk(courseId, {
    include: [{ model: Department, as: "department" }],
  });
  return {
    scopeType: SCOPE_TYPES.TENANT,
    tenantId: course?.department?.tenant_id ?? null,
  };
};

const resolveTenantScopeFromCourseParam = (req) => resolveCourseTenantScopeById(req.params.courseId);

const resolveTenantScopeFromVersionParam = async (req) => {
  const version = await ContentVersion.findByPk(req.params.id);
  return resolveCourseTenantScopeById(version?.course_id);
};

const resolveCourseIdFromParam = (req) => Number(req.params.courseId);

const resolveCourseIdFromVersion = async (req) => {
  const version = await ContentVersion.findByPk(req.params.id);
  return version?.course_id;
};

// CCA-API-17: Published content structure (for downstream systems - authenticated, view only)
router.get(
  "/courses/:courseId/published",
  requirePermission("content.version.view", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.getPublishedStructure
);

// CCA-11: Preview draft structure (view only)
router.get(
  "/courses/:courseId/preview",
  requirePermission("content.version.view", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.previewDraft
);

// List and create versions for a course
router.get(
  "/courses/:courseId/versions",
  requirePermission("content.version.view", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 })]),
  ContentVersionController.list
);

router.post(
  "/courses/:courseId/versions",
  requirePermission("content.version.manage", resolveTenantScopeFromCourseParam),
  requireCourseAuthor(resolveCourseIdFromParam),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("versionLabel").isString().notEmpty(),
    body("changelog").optional().isString(),
  ]),
  ContentVersionController.create
);

// Get version detail
router.get(
  "/versions/:id",
  requirePermission("content.version.view", resolveTenantScopeFromVersionParam),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.detail
);

// Read-only publish readiness check
router.get(
  "/versions/:id/validate",
  requirePermission("content.version.view", resolveTenantScopeFromVersionParam),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.validate
);

// Submit for review
router.post(
  "/versions/:id/submit-review",
  requirePermission("content.version.manage", resolveTenantScopeFromVersionParam),
  requireCourseAuthor(resolveCourseIdFromVersion),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.submitForReview
);

// Approve / request changes -- reviewer permission, no course-author check (Admin/Academic Admin)
router.post(
  "/versions/:id/review-decision",
  requirePermission("content.review.decide", resolveTenantScopeFromVersionParam),
  validate([
    param("id").isInt({ min: 1 }),
    body("decision").isIn(["APPROVED", "CHANGES_REQUESTED"]),
    body("comment").optional().isString(),
  ]),
  ContentVersionController.reviewDecision
);

router.get(
  "/versions/:id/reviews",
  requirePermission("content.version.view", resolveTenantScopeFromVersionParam),
  validate([param("id").isInt({ min: 1 })]),
  ContentReviewController.listForVersion
);

// Publish content version
router.post(
  "/versions/:id/publish",
  requirePermission("content.version.publish", resolveTenantScopeFromVersionParam),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.publish
);

// Archive content version
router.patch(
  "/versions/:id/archive",
  requirePermission("content.version.publish", resolveTenantScopeFromVersionParam),
  validate([param("id").isInt({ min: 1 })]),
  ContentVersionController.archive
);

module.exports = router;
