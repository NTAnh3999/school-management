const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const QuizQuestion = sequelize.define(
  "QuizQuestion",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "quizzes", key: "id" },
    },
    question_text: { type: DataTypes.TEXT, allowNull: false },
    question_type: {
      type: DataTypes.ENUM("single_choice", "multiple_choice", "text"),
      defaultValue: "single_choice",
    },
    points: { type: DataTypes.DECIMAL(5, 2), defaultValue: 1.0 },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "quiz_questions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = QuizQuestion;
