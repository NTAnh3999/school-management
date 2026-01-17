const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const CourseController = require("../controllers/course.controller");

// Admin/Teacher only
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["Admin", "Teacher"]),
  validate([
    body("name").isString().notEmpty(),
    body("description").optional().isString(),
    body("startDate").optional().isISO8601(),
    body("endDate").optional().isISO8601(),
    body("teacherId").isInt({ min: 1 }),
  ]),
  CourseController.create
);

router.get("/", AuthMiddleware.verifyToken, CourseController.list);
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  CourseController.detail
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["Admin", "Teacher"]),
  validate([
    param("id").isInt({ min: 1 }),
    body("name").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("startDate").optional().isISO8601(),
    body("endDate").optional().isISO8601(),
    body("teacherId").optional().isInt({ min: 1 }),
  ]),
  CourseController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["Admin", "Teacher"]),
  validate([param("id").isInt({ min: 1 })]),
  CourseController.remove
);

module.exports = router;
