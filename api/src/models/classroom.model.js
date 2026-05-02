"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Classroom = sequelize.define(
  "Classroom",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    classroom_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    classroom_name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
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
    status: {
      type: DataTypes.ENUM(
        "draft",
        "open",
        "full",
        "in_progress",
        "completed",
        "cancelled",
        "archived"
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    delivery_method: {
      type: DataTypes.ENUM("online", "offline", "hybrid"),
      allowNull: false,
      defaultValue: "offline",
    },
    campus_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    online_meeting_link: { type: DataTypes.STRING(500), allowNull: true },
    academic_year: { type: DataTypes.STRING(20), allowNull: true },
    term: { type: DataTypes.STRING(100), allowNull: true },
    language: { type: DataTypes.STRING(50), allowNull: true },
    tags: { type: DataTypes.JSON, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    enrollment_mode: {
      type: DataTypes.ENUM("manual", "self_enrollment", "invitation_only"),
      allowNull: false,
      defaultValue: "manual",
    },
    enrollment_start_date: { type: DataTypes.DATEONLY, allowNull: true },
    enrollment_end_date: { type: DataTypes.DATEONLY, allowNull: true },
    min_capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
    max_capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
    enrolled_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    waitlist_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approval_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    visibility: {
      type: DataTypes.ENUM("public", "private", "internal"),
      allowNull: false,
      defaultValue: "internal",
    },
    cancelled_reason: { type: DataTypes.TEXT, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "classrooms",
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: { is_deleted: false },
    },
    scopes: {
      withDeleted: { where: {} },
    },
  }
);

module.exports = Classroom;
