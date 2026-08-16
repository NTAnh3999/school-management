const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { requireCourseAuthor } = require("../middleware/course-author.middleware");
const LearningItemController = require("../controllers/learning-item.controller");
const { Course, Department, CourseModule, Lesson, LearningItem } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

const resolveCourseTenantScopeById = async (courseId) => {
  if (!courseId) return { scopeType: SCOPE_TYPES.TENANT, tenantId: null };
  const course = await Course.findByPk(courseId, {
    include: [{ model: Department, as: "department" }],
  });
  return { scopeType: SCOPE_TYPES.TENANT, tenantId: course?.department?.tenant_id ?? null };
};

const resolveTenantScopeFromLessonParam = async (req) => {
  const lesson = await Lesson.findByPk(req.params.lessonId, {
    include: [{ model: CourseModule, as: "module" }],
  });
  return resolveCourseTenantScopeById(lesson?.module?.course_id);
};

const resolveTenantScopeFromItemParam = async (req) => {
  const item = await LearningItem.findByPk(req.params.id, {
    include: [{ model: Lesson, as: "lesson", include: [{ model: CourseModule, as: "module" }] }],
  });
  return resolveCourseTenantScopeById(item?.lesson?.module?.course_id);
};

const resolveCourseIdFromLesson = async (req) => {
  const lesson = await Lesson.findByPk(req.params.lessonId, {
    include: [{ model: CourseModule, as: "module" }],
  });
  return lesson?.module?.course_id;
};

const resolveCourseIdFromItem = async (req) => {
  const item = await LearningItem.findByPk(req.params.id, {
    include: [{ model: Lesson, as: "lesson", include: [{ model: CourseModule, as: "module" }] }],
  });
  return item?.lesson?.module?.course_id;
};

router.get(
  "/lesson/:lessonId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromLessonParam),
  validate([param("lessonId").isInt({ min: 1 })]),
  LearningItemController.list
);

router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.view", resolveTenantScopeFromItemParam),
  validate([param("id").isInt({ min: 1 })]),
  LearningItemController.detail
);

router.post(
  "/lesson/:lessonId",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromLessonParam),
  requireCourseAuthor(resolveCourseIdFromLesson),
  validate([
    param("lessonId").isInt({ min: 1 }),
    body("itemType").isString().notEmpty(),
    body("title").isString().notEmpty(),
    body("contentPayload").optional().isObject(),
    body("assetId").optional().isInt({ min: 1 }),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("estimatedDuration").optional().isFloat({ min: 0 }),
    body("isRequired").optional().isBoolean(),
  ]),
  LearningItemController.create
);

router.patch(
  "/:id",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromItemParam),
  requireCourseAuthor(resolveCourseIdFromItem),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("contentPayload").optional().isObject(),
    body("assetId").optional().isInt({ min: 1 }),
    body("displayOrder").optional().isInt({ min: 0 }),
    body("estimatedDuration").optional().isFloat({ min: 0 }),
    body("isRequired").optional().isBoolean(),
    body("revision").isInt({ min: 1 }),
  ]),
  LearningItemController.update
);

router.patch(
  "/:id/archive",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromItemParam),
  requireCourseAuthor(resolveCourseIdFromItem),
  validate([param("id").isInt({ min: 1 })]),
  LearningItemController.archive
);

router.patch(
  "/lesson/:lessonId/reorder",
  AuthMiddleware.verifyToken,
  requirePermission("content.version.manage", resolveTenantScopeFromLessonParam),
  requireCourseAuthor(resolveCourseIdFromLesson),
  validate([param("lessonId").isInt({ min: 1 }), body("orderedIds").isArray({ min: 1 })]),
  LearningItemController.reorder
);

module.exports = router;
