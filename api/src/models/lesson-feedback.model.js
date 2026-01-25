const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const LessonFeedback = sequelize.define(
  "LessonFeedback",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    lesson_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "lessons", key: "id" },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    feedback_text: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "lesson_feedback",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LessonFeedback;
