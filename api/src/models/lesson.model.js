const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Lesson = sequelize.define(
  "Lesson",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    section_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "course_sections", key: "id" },
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    lesson_type: {
      type: DataTypes.ENUM("video", "text", "quiz", "assignment"),
      defaultValue: "text",
    },
    video_url: { type: DataTypes.STRING(255), allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "lessons",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Lesson;
