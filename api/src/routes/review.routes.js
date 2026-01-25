const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const ReviewController = require("../controllers/review.controller");

// Get reviews for a course (public)
router.get(
  "/course/:courseId",
  validate([param("courseId").isInt({ min: 1 })]),
  ReviewController.getCourseReviews
);

// Student routes
router.post(
  "/course/:courseId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([
    param("courseId").isInt({ min: 1 }),
    body("rating").isInt({ min: 1, max: 5 }),
    body("reviewText").optional().isString(),
  ]),
  ReviewController.createReview
);

router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  validate([
    param("id").isInt({ min: 1 }),
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("reviewText").optional().isString(),
  ]),
  ReviewController.updateReview
);

router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  validate([param("id").isInt({ min: 1 })]),
  ReviewController.deleteReview
);

module.exports = router;
