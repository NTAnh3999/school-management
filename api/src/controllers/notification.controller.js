const { OKResponse } = require("../utils/success-responses");
const NotificationService = require("../services/notification.service");
const asyncHandler = require("../utils/async-handler");

const getNotifications = asyncHandler(async (req, res) => {
  const onlyUnread = req.query.unread === "true";
  const notifications = await NotificationService.getNotifications(req.user.id, onlyUnread);
  return new OKResponse({ metadata: { notifications } }).send(res);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
  return new OKResponse({
    message: "Notification marked as read",
    metadata: { notification },
  }).send(res);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(req.user.id);
  return new OKResponse({ message: "All notifications marked as read" }).send(res);
});

const deleteNotification = asyncHandler(async (req, res) => {
  await NotificationService.deleteNotification(req.params.id, req.user.id);
  return new OKResponse({ message: "Notification deleted" }).send(res);
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
