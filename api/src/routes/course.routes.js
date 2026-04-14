const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const CourseController = require("../controllers/course.controller");
const { ROLES, STAFF_ROLES } = require("../constants/roles");

// Public routes
router.get("/", CourseController.list);
router.get("/:id", validate([param("id").isInt({ min: 1 })]), CourseController.detail);

// Student routes
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

// Instructor/Admin routes
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("price").optional().isFloat({ min: 0 }),
  ]),
  CourseController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("price").optional().isFloat({ min: 0 }),
    body("status").optional().isIn(["draft", "published", "archived"]),
  ]),
  CourseController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(STAFF_ROLES),
  validate([param("id").isInt({ min: 1 })]),
  CourseController.remove
);

module.exports = router;

module.exports = router;
