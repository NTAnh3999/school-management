"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

// Mirrors enrollment-event-outbox.model.js's shape/scope: write-only from this module's
// services, no consumer/worker built (matches EnrollmentEventOutbox's current, intentional
// scope in this codebase).
const ContentVersionEventOutbox = sequelize.define(
  "ContentVersionEventOutbox",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    event_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    event_type: { type: DataTypes.STRING(100), allowNull: false },
    tenant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    content_asset_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_assets", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "courses", key: "id" },
    },
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
    tableName: "content_version_event_outbox",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ContentVersionEventOutbox;
