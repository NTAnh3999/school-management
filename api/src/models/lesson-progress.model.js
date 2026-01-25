const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const LessonProgress = sequelize.define(
  "LessonProgress",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    lesson_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "lessons", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("not_started", "in_progress", "completed"),
      defaultValue: "not_started",
    },
    completion_date: { type: DataTypes.DATE, allowNull: true },
    time_spent_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "lesson_progress",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LessonProgress;
