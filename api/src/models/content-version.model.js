const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ContentVersion = sequelize.define(
  "ContentVersion",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    content_root_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "course_content_roots", key: "id" },
    },
    based_on_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    version_label: { type: DataTypes.STRING(100), allowNull: false },
    version_no: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "IN_REVIEW",
        "CHANGES_REQUESTED",
        "APPROVED",
        "PUBLISHED",
        "ARCHIVED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    revision: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    changelog: { type: DataTypes.TEXT, allowNull: true },
    snapshot_ref: { type: DataTypes.JSON, allowNull: true },
    submitted_for_review_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    submitted_for_review_at: { type: DataTypes.DATE, allowNull: true },
    approved_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    published_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "content_versions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ContentVersion;
