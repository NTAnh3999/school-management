const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Quiz = sequelize.define(
  "Quiz",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    lesson_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "lessons", key: "id" },
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assessment_type: {
      type: DataTypes.ENUM("quiz", "assignment", "exam", "survey", "other"),
      allowNull: false,
      defaultValue: "quiz",
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
    status: {
      type: DataTypes.ENUM("draft", "published", "closed", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    open_at: { type: DataTypes.DATE, allowNull: true },
    close_at: { type: DataTypes.DATE, allowNull: true },
    passing_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 70.0 },
    time_limit_minutes: { type: DataTypes.INTEGER, allowNull: true },
    max_attempts: { type: DataTypes.INTEGER, defaultValue: 3 },
    max_score: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    grading_method: {
      type: DataTypes.ENUM("auto", "manual", "hybrid"),
      allowNull: false,
      defaultValue: "auto",
    },
    publish_policy: {
      type: DataTypes.ENUM("manual", "auto_after_graded", "scheduled"),
      allowNull: false,
      defaultValue: "manual",
    },
    result_publish_at: { type: DataTypes.DATE, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    published_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    closed_at: { type: DataTypes.DATE, allowNull: true },
    closed_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    archived_at: { type: DataTypes.DATE, allowNull: true },
    archived_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "quizzes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Quiz;
