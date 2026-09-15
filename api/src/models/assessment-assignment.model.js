"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentAssignment = sequelize.define(
  "AssessmentAssignment",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    assessment_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "assessment_versions", key: "id" },
    },
    legacy_quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      unique: true,
      references: { model: "quizzes", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "courses", key: "id" },
    },
    classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "classrooms", key: "id" },
    },
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    module_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "course_modules", key: "id" },
    },
    lesson_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "lessons", key: "id" },
    },
    open_at: { type: DataTypes.DATE, allowNull: true },
    close_at: { type: DataTypes.DATE, allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    attempt_limit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    selection_policy: {
      type: DataTypes.ENUM(
        "highest_released_score",
        "latest_released_attempt",
        "first_released_attempt",
        "average_released_score"
      ),
      allowNull: false,
      defaultValue: "highest_released_score",
    },
    layout_mode: {
      type: DataTypes.ENUM("all_in_one_page", "one_at_a_time"),
      allowNull: false,
      defaultValue: "all_in_one_page",
    },
    allow_question_review: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    status: {
      type: DataTypes.ENUM("draft", "scheduled", "open", "closed", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    publish_policy: {
      type: DataTypes.ENUM("manual", "auto_after_graded", "scheduled"),
      allowNull: false,
      defaultValue: "manual",
    },
    result_publish_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "assessment_assignments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentAssignment;
