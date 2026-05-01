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
    version_label: { type: DataTypes.STRING(100), allowNull: false },
    version_no: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM("DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    changelog: { type: DataTypes.TEXT, allowNull: true },
    snapshot_ref: { type: DataTypes.JSON, allowNull: true },
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
