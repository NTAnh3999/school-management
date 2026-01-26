const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");

router.post(
  "/register",
  validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("fullName").isString().notEmpty().withMessage("Full name is required"),
    body("roleName")
      .optional()
      .isIn(["Student", "Teacher", "Admin"])
      .withMessage("roleName must be one of Student, Teacher, Admin"),
  ]),
  AuthController.register
);
router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ]),
  AuthController.login
);

router.post(
  "/refresh",
  validate([body("refreshToken").isString().notEmpty().withMessage("Refresh token is required")]),
  AuthController.refresh
);

router.post("/logout", AuthController.logout);

module.exports = router;
