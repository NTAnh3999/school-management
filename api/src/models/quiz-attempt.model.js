const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const QuizAttempt = sequelize.define(
  "QuizAttempt",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "quizzes", key: "id" },
    },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "not_started",
        "in_progress",
        "submitted",
        "graded",
        "published",
        "expired"
      ),
      defaultValue: "in_progress",
    },
    started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expired_at: { type: DataTypes.DATE, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    attempt_number: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  {
    tableName: "quiz_attempts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = QuizAttempt;
