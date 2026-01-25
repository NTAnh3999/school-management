const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const QuizOption = sequelize.define(
  "QuizOption",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    question_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "quiz_questions", key: "id" },
    },
    option_text: { type: DataTypes.TEXT, allowNull: false },
    is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "quiz_options",
    timestamps: true,
    underscored: true,
  }
);

module.exports = QuizOption;
