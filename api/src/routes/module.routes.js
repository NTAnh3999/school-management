const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { requireCourseAuthor } = require("../middleware/course-author.middleware");
const ModuleController = require("../controllers/module.controller");
const { Course, Department, ContentVersion } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

const resolveCourseTenantScopeById = async (courseId) => {
  if (!courseId) return { scopeType: SCOPE_TYPES.TENANT, tenantId: null };
  const course = await Course.findByPk(courseId, {
    include: [{ model: Department, as: "department" }],
  });
  return { scopeType: SCOPE_TYPES.TENANT, tenantId: course?.department?.tenant_id ?? null };
};

const resolveTenantScopeFromCourseParam = (req) => resolveCourseTenantScopeById(req.params.courseId);

const resolveTenantScopeFromVersionParam = async (req) => {
  const version = await ContentVersion.findByPk(req.params.versionId);
  return resolveCourseTenantScopeById(version?.course_id);
};

const resolveTenantScopeFromModuleParam = async (req) => {
  const { CourseModule } = require("../models");
  const courseModule = await CourseModule.findByPk(req.params.id);
  return resolveCourseTenantScopeById(courseModule?.course_id);
};

const resolveCourseIdFromParam = (req) => Number(req.params.courseId);

const resolveCourseIdFromVersion = async (req) => {
  const version = await ContentVersion.findByPk(req.params.versionId);
  return version?.course_id;
};

const resolveCourseIdFromModule = async (req) => {
  const { CourseModule } = require("../models");
  const courseModule = await CourseModule.findByPk(req.params.id);
  return courseModule?.course_id;
};

// Course-global list -- resolves to the course's current open Draft (or Published) version.
router.get(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 })]),
  ModuleController.list
);

// Version-scoped list -- authoring UI's primary read path once a specific Draft is open.
router.get(
  "/version/:versionId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromVersionParam),
  validate([param("versionId").isInt({ min: 1 })]),
  ModuleController.listByVersion
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromModuleParam),
  validate([param("id").isInt({ min: 1 })]),
  ModuleController.detail
);

router.post(
  "/version/:versionId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromVersionParam),
  requireCourseAuthor(resolveCourseIdFromVersion),
  validate([
    param("versionId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  ModuleController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromModuleParam),
  requireCourseAuthor(resolveCourseIdFromModule),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("revision").isInt({ min: 1 }),
  ]),
  ModuleController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromModuleParam),
  requireCourseAuthor(resolveCourseIdFromModule),
  validate([param("id").isInt({ min: 1 })]),
  ModuleController.remove
);

router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromModuleParam),
  requireCourseAuthor(resolveCourseIdFromModule),
  validate([param("id").isInt({ min: 1 })]),
  ModuleController.archive
);

router.patch(
  "/version/:versionId/reorder",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromVersionParam),
  requireCourseAuthor(resolveCourseIdFromVersion),
  validate([param("versionId").isInt({ min: 1 }), body("orderedIds").isArray({ min: 1 })]),
  ModuleController.reorder
);

module.exports = router;
