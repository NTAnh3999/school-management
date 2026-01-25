const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    notification_type: {
      type: DataTypes.ENUM("progress", "assignment", "reward", "course", "general"),
      defaultValue: "general",
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Notification;
