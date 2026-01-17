const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const UserController = require("../controllers/user.controller");

router.get("/me", AuthMiddleware.verifyToken, UserController.getMe);
router.put(
  "/me",
  AuthMiddleware.verifyToken,
  validate([body("fullName").isString().notEmpty()]),
  UserController.updateMe
);

module.exports = router;
