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
    // NOT NULL as of migration 019 (content_version_id backfilled + FK'd with a fixed name,
    // fk_items_content_version, ON DELETE CASCADE). Must stay allowNull:false here or
    // sequelize.sync() tries to re-derive a conflicting ON DELETE SET NULL FK on every boot.
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "content_versions", key: "id" },
    },
    revision: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    item_type: {
      type: DataTypes.ENUM(
        "Text",
        "Video",
        "Document",
        "Infographic",
        "ExternalLink",
        "KnowledgeCheck",
        "AssessmentReference",
        "Model3D",
        "InteractivePackage"
      ),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content_payload: { type: DataTypes.JSON, allowNull: true },
    asset_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_assets", key: "id" },
    },
    // FSD 7.2/5.4: only meaningful for item_type = Video (uploaded -> asset_id; external ->
    // content_payload.url). Null for every other item_type.
    source: {
      type: DataTypes.ENUM("uploaded", "external"),
      allowNull: true,
    },
    // FSD 5.4's fixed one-per-item_type mapping (see constants/content.js's
    // COMPLETION_RULE_BY_ITEM_TYPE) -- stored explicitly rather than re-derived, so completion
    // tracking/downstream consumers can query on it directly.
    completion_rule: {
      type: DataTypes.ENUM(
        "dwell_time",
        "watch_percentage",
        "opened",
        "clicked",
        "submitted",
        "delegated",
        "interacted",
        "xapi_statement"
      ),
      allowNull: true,
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
