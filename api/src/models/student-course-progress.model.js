const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const StudentCourseProgress = sequelize.define(
  "StudentCourseProgress",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    course_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("not_started", "in_progress", "completed", "blocked", "archived"),
      allowNull: false,
      defaultValue: "not_started",
    },
    completion_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0 },
    completed_item_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    total_item_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    total_time_spent_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    progress_snapshot: { type: DataTypes.JSON, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    last_computed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "student_course_progress",
    timestamps: true,
    underscored: true,
  }
);

module.exports = StudentCourseProgress;
