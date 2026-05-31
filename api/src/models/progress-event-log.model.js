const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ProgressEventLog = sequelize.define(
  "ProgressEventLog",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    progress_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "student_course_progress", key: "id" },
    },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    learner_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    course_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    source_module: { type: DataTypes.STRING(100), allowNull: false },
    source_event_name: { type: DataTypes.STRING(100), allowNull: false },
    source_event_id: { type: DataTypes.STRING(120), allowNull: true },
    process_status: {
      type: DataTypes.ENUM("received", "success", "failed", "ignored"),
      allowNull: false,
      defaultValue: "success",
    },
    error_code: { type: DataTypes.STRING(100), allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    received_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    processed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "progress_event_logs",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ProgressEventLog;
