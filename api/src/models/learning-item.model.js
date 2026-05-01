const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const LearningItem = sequelize.define(
  "LearningItem",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    lesson_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "lessons", key: "id" },
    },
    item_type: {
      type: DataTypes.ENUM("VIDEO", "QUIZ", "INFOGRAPHIC", "DOCUMENT", "TEXT"),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content_payload: { type: DataTypes.JSON, allowNull: true },
    asset_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_assets", key: "id" },
    },
    display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    estimated_duration: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    is_required: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: {
      type: DataTypes.ENUM("draft", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "learning_items",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LearningItem;
