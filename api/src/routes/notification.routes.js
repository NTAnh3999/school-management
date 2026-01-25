const express = require("express");
const { param } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const router = express.Router();
const AuthMiddleware = require("../middleware/auth.middleware");
const NotificationController = require("../controllers/notification.controller");

// All routes require authentication
router.use(AuthMiddleware.verifyToken);

router.get("/", NotificationController.getNotifications);

router.put(
  "/:id/read",
  validate([param("id").isInt({ min: 1 })]),
  NotificationController.markAsRead
);

router.put("/read-all", NotificationController.markAllAsRead);

router.delete(
  "/:id",
  validate([param("id").isInt({ min: 1 })]),
  NotificationController.deleteNotification
);

module.exports = router;
