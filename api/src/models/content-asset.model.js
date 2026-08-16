const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ContentAsset = sequelize.define(
  "ContentAsset",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "tenants", key: "id" },
    },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    media_type: { type: DataTypes.STRING(50), allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    size_bytes: { type: DataTypes.BIGINT, allowNull: true },
    duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
    storage_key: { type: DataTypes.STRING(500), allowNull: false },
    thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
    // Metadata only -- this module never uploads/transcodes. An external pipeline (or the
    // client, in this codebase's current no-pipeline state) PATCHes this once ready.
    processing_status: {
      type: DataTypes.ENUM("pending", "processing", "ready", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    uploaded_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "content_assets",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ContentAsset;
