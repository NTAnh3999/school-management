const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { requireCourseAuthor } = require("../middleware/course-author.middleware");
const LessonController = require("../controllers/lesson.controller");
const { Course, Department, CourseModule, Lesson } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

const resolveCourseTenantScopeById = async (courseId) => {
  if (!courseId) return { scopeType: SCOPE_TYPES.TENANT, tenantId: null };
  const course = await Course.findByPk(courseId, {
    include: [{ model: Department, as: "department" }],
  });
  return { scopeType: SCOPE_TYPES.TENANT, tenantId: course?.department?.tenant_id ?? null };
};

const resolveTenantScopeFromModuleParam = async (req) => {
  const courseModule = await CourseModule.findByPk(req.params.moduleId);
  return resolveCourseTenantScopeById(courseModule?.course_id);
};

const resolveTenantScopeFromLessonParam = async (req) => {
  const lesson = await Lesson.findByPk(req.params.id, { include: [{ model: CourseModule, as: "module" }] });
  return resolveCourseTenantScopeById(lesson?.module?.course_id);
};

const resolveCourseIdFromModule = async (req) => {
  const courseModule = await CourseModule.findByPk(req.params.moduleId);
  return courseModule?.course_id;
};

const resolveCourseIdFromLesson = async (req) => {
  const lesson = await Lesson.findByPk(req.params.id, { include: [{ model: CourseModule, as: "module" }] });
  return lesson?.module?.course_id;
};

// Get lessons for a module
router.get(
  "/module/:moduleId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromModuleParam),
  validate([param("moduleId").isInt({ min: 1 })]),
  LessonController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromLessonParam),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.detail
);

router.post(
  "/module/:moduleId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromModuleParam),
  requireCourseAuthor(resolveCourseIdFromModule),
  validate([
    param("moduleId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("objective").optional().isString(),
    body("lessonSummary").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("displayOrder").optional().isInt({ min: 0 }),
  ]),
  LessonController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromLessonParam),
  requireCourseAuthor(resolveCourseIdFromLesson),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("objective").optional().isString(),
    body("lessonSummary").optional().isString(),
    body("durationMinutes").optional().isInt({ min: 0 }),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("revision").isInt({ min: 1 }),
  ]),
  LessonController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromLessonParam),
  requireCourseAuthor(resolveCourseIdFromLesson),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.remove
);

router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromLessonParam),
  requireCourseAuthor(resolveCourseIdFromLesson),
  validate([param("id").isInt({ min: 1 })]),
  LessonController.archive
);

module.exports = router;
