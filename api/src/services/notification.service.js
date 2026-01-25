const { NotFoundError } = require("../utils/error-responses");
const { Notification } = require("../models");

const create = async (userId, { type, title, message }) => {
  return Notification.create({
    user_id: userId,
    notification_type: type || "general",
    title,
    message,
  });
};

const getNotifications = async (userId, onlyUnread = false) => {
  const where = { user_id: userId };
  if (onlyUnread) where.is_read = false;

  return Notification.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) throw new NotFoundError("Notification not found");

  notification.is_read = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
  return true;
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) throw new NotFoundError("Notification not found");
  await notification.destroy();
  return true;
};

module.exports = {
  create,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
