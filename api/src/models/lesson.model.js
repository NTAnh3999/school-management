const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Lesson = sequelize.define(
  "Lesson",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    module_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "course_modules", key: "id" },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    lesson_summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    lesson_type: {
      type: DataTypes.ENUM("Standard", "Microlearning", "QuizOnly"),
      defaultValue: "Standard",
    },
    video_url: { type: DataTypes.STRING(255), allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("draft", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    estimated_duration: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "lessons",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Lesson;
