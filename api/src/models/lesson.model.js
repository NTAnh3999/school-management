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
    // NOT NULL as of migration 019 (content_version_id backfilled + FK'd with a fixed name,
    // fk_lessons_content_version, ON DELETE CASCADE). Must stay allowNull:false here or
    // sequelize.sync() tries to re-derive a conflicting ON DELETE SET NULL FK on every boot.
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "content_versions", key: "id" },
    },
    revision: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    title: { type: DataTypes.STRING(255), allowNull: false },
    // FSD 7.2 core field: the lesson's learning objective (mục tiêu bài học). Distinct from
    // lesson_summary, which stays optional/free-form.
    objective: { type: DataTypes.TEXT, allowNull: true },
    lesson_summary: { type: DataTypes.TEXT, allowNull: true },
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
