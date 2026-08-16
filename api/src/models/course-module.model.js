const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const CourseModule = sequelize.define(
  "CourseModule",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    // NOT NULL as of migration 019 (content_version_id backfilled + FK'd with a fixed name,
    // fk_modules_content_version, ON DELETE CASCADE). Must stay allowNull:false here or
    // sequelize.sync() tries to re-derive a conflicting ON DELETE SET NULL FK on every boot.
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "content_versions", key: "id" },
    },
    revision: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("draft", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "course_modules",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CourseModule;
