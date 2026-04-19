const express = require("express");
const { body, param, query } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const CourseController = require("../controllers/course.controller");
const { ROLES } = require("../constants/roles");

const VALID_STATUSES = ["draft", "active", "inactive", "archived"];

// ---------------------------------------------------------------------------
// Public / optional-auth routes
// ---------------------------------------------------------------------------
router.get(
  "/",
  AuthMiddleware.optionalToken,
  validate([
    query("keyword").optional().isString(),
    query("status").optional().isIn(VALID_STATUSES),
    query("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    query("departmentId").optional().isInt({ min: 1 }),
    query("teacherId").optional().isInt({ min: 1 }),
    query("courseType").optional().isString(),
    query("page").optional().isInt({ min: 1 }),
    query("page_size").optional().isInt({ min: 1, max: 100 }),
  ]),
  CourseController.list
);

router.get(
  "/:id",
  AuthMiddleware.optionalToken,
  validate([param("id").isInt({ min: 1 })]),
  CourseController.detail
);

// ---------------------------------------------------------------------------
// Student routes
// ---------------------------------------------------------------------------
router.post(
  "/:id/enroll",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.STUDENT]),
  validate([param("id").isInt({ min: 1 })]),
  CourseController.enroll
);

router.get(
  "/my/enrollments",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.STUDENT]),
  CourseController.getEnrollments
);

// ---------------------------------------------------------------------------
// Admin-only routes
// ---------------------------------------------------------------------------

// COURSE-01: Create Course
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    body("course_code").isString().notEmpty().withMessage("course_code is required"),
    body("title").isString().notEmpty().withMessage("title is required"),
    body("department_id").optional().isInt({ min: 1 }),
    body("description").optional().isString(),
    body("course_type").optional().isString(),
    body("credit").optional().isFloat({ min: 0.01 }),
    body("duration_hours").optional().isFloat({ min: 0.01 }),
    body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("price").optional().isFloat({ min: 0 }),
    body("status").optional().isIn(VALID_STATUSES),
    body("effective_from").optional().isDate(),
    body("effective_to").optional().isDate(),
  ]),
  CourseController.create
);

// COURSE-02: Update Course
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("course_code").optional().isString().notEmpty(),
    body("title").optional().isString().notEmpty(),
    body("department_id").optional().isInt({ min: 1 }),
    body("description").optional().isString(),
    body("course_type").optional().isString(),
    body("credit").optional().isFloat({ min: 0.01 }),
    body("duration_hours").optional().isFloat({ min: 0.01 }),
    body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("price").optional().isFloat({ min: 0 }),
    body("effective_from").optional().isDate(),
    body("effective_to").optional().isDate(),
  ]),
  CourseController.update
);

// COURSE-03: Change Status (separate endpoint)
router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("status")
      .isIn(VALID_STATUSES)
      .withMessage(`status must be one of: ${VALID_STATUSES.join(", ")}`),
  ]),
  CourseController.changeStatus
);

// COURSE-04: Manage Prerequisites
router.put(
  "/:id/prerequisites",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([
    param("id").isInt({ min: 1 }),
    body("prerequisites").isArray().withMessage("prerequisites must be an array"),
    body("prerequisites.*.prerequisite_course_id")
      .isInt({ min: 1 })
      .withMessage("prerequisite_course_id must be a positive integer"),
    body("prerequisites.*.prerequisite_type")
      .optional()
      .isIn(["ALL", "ANY"])
      .withMessage("prerequisite_type must be ALL or ANY"),
  ]),
  CourseController.updatePrerequisites
);

// COURSE-07: Delete Course (soft delete)
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole([ROLES.ADMIN]),
  validate([param("id").isInt({ min: 1 })]),
  CourseController.remove
);

module.exports = router;
