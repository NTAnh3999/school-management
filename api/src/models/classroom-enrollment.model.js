"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ClassroomEnrollment = sequelize.define(
  "ClassroomEnrollment",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classrooms", key: "id" },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    enrollment_status: {
      type: DataTypes.ENUM(
        "pending_approval",
        "enrolled",
        "waitlisted",
        "withdrawn",
        "transferred",
        "rejected",
        "completed",
        "failed"
      ),
      allowNull: false,
      defaultValue: "enrolled",
    },
    enrollment_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    source: {
      type: DataTypes.ENUM("manual", "self_enrollment", "import", "api"),
      allowNull: false,
      defaultValue: "manual",
    },
    approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    withdrawn_reason: { type: DataTypes.TEXT, allowNull: true },
    transferred_to_classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "classrooms", key: "id" },
    },
    completion_status: {
      type: DataTypes.ENUM("not_started", "in_progress", "completed", "not_completed"),
      allowNull: false,
      defaultValue: "not_started",
    },
    attendance_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0.0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "classroom_enrollments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ClassroomEnrollment;
