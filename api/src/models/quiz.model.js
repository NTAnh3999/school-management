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
    passing_score: { type: DataTypes.DECIMAL(5, 2), defaultValue: 70.0 },
    time_limit_minutes: { type: DataTypes.INTEGER, allowNull: true },
    max_attempts: { type: DataTypes.INTEGER, defaultValue: 3 },
  },
  {
    tableName: "quizzes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Quiz;
