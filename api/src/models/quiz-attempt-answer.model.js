const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const QuizAttemptAnswer = sequelize.define(
  "QuizAttemptAnswer",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    attempt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "quiz_attempts", key: "id" },
    },
    question_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "quiz_questions", key: "id" },
    },
    selected_option_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "quiz_options", key: "id" },
    },
    text_answer: { type: DataTypes.TEXT, allowNull: true },
    is_correct: { type: DataTypes.BOOLEAN, allowNull: true },
  },
  {
    tableName: "quiz_attempt_answers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = QuizAttemptAnswer;
