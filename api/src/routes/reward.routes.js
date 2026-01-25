const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const RoleMiddleware = require("../middleware/role.middleware");
const RewardController = require("../controllers/reward.controller");

// Get all available rewards
router.get("/", AuthMiddleware.verifyToken, RewardController.getAllRewards);

// Get student's earned rewards
router.get(
  "/my",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["student"]),
  RewardController.getStudentRewards
);

router.get(
  "/student/:studentId",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([param("studentId").isInt({ min: 1 })]),
  RewardController.getStudentRewards
);

// Admin routes
router.post(
  "/",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin"]),
  validate([
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("rewardType").optional().isIn(["certificate", "badge", "points"]),
    body("pointsValue").optional().isInt({ min: 0 }),
    body("iconUrl").optional().isString(),
  ]),
  RewardController.createReward
);

router.post(
  "/award",
  AuthMiddleware.verifyToken,
  RoleMiddleware.requireRole(["admin", "instructor"]),
  validate([
    body("studentId").isInt({ min: 1 }),
    body("rewardId").isInt({ min: 1 }),
    body("enrollmentId").optional().isInt({ min: 1 }),
  ]),
  RewardController.awardReward
);

module.exports = router;
