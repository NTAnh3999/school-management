const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const SectionController = require("../controllers/section.controller");

// Get sections for a course (public if course is published)
router.get(
  "/course/:courseId",
  validate([param("courseId").isInt({ min: 1 })]),
  SectionController.list
);

router.get("/:id", validate([param("id").isInt({ min: 1 })]), SectionController.detail);

// Instructor/Admin routes
router.post(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("orderIndex").optional().isInt({ min: 0 }),
  ]),
  SectionController.create
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    param("id").isInt({ min: 1 }),
    body("title").optional().isString().notEmpty(),
    body("description").optional().isString(),
    body("orderIndex").optional().isInt({ min: 0 }),
  ]),
  SectionController.update
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([param("id").isInt({ min: 1 })]),
  SectionController.remove
);

module.exports = router;
