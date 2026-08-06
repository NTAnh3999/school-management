"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const EnrollmentEventOutbox = sequelize.define(
  "EnrollmentEventOutbox",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    event_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    event_type: { type: DataTypes.STRING(100), allowNull: false },
    tenant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
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
    classroom_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    previous_status: { type: DataTypes.STRING(40), allowNull: true },
    current_status: { type: DataTypes.STRING(40), allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: true },
    process_status: {
      type: DataTypes.ENUM("pending", "processing", "published", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    retry_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    published_at: { type: DataTypes.DATE, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "enrollment_event_outbox",
    timestamps: true,
    underscored: true,
  }
);

module.exports = EnrollmentEventOutbox;
