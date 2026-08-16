const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const CourseAuthorController = require("../controllers/course-author.controller");
const { Course, Department } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

router.use(AuthMiddleware.verifyToken);

const resolveTenantScopeFromCourseParam = async (req) => {
  const course = await Course.findByPk(req.params.courseId, {
    include: [{ model: Department, as: "department" }],
  });
  return { scopeType: SCOPE_TYPES.TENANT, tenantId: course?.department?.tenant_id ?? null };
};

// Assigning/revoking authors is a course-management capability, not content-authoring itself --
// gated on content.version.manage.any (Admin/Academic-Admin) so an author can't self-assign
// co-authors onto a course they don't administer.
router.get(
  "/:courseId/authors",
  requirePermission("content.version.view", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 })]),
  CourseAuthorController.list
);

router.post(
  "/:courseId/authors",
  requirePermission("content.version.manage.any", resolveTenantScopeFromCourseParam),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("userId").isInt({ min: 1 }),
    body("roleInCourse").optional().isIn(["primary_author", "co_author"]),
  ]),
  CourseAuthorController.assign
);

router.delete(
  "/:courseId/authors/:userId",
  requirePermission("content.version.manage.any", resolveTenantScopeFromCourseParam),
  validate([param("courseId").isInt({ min: 1 }), param("userId").isInt({ min: 1 })]),
  CourseAuthorController.revoke
);

module.exports = router;
