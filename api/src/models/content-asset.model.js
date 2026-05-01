const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ContentAsset = sequelize.define(
  "ContentAsset",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    media_type: { type: DataTypes.STRING(50), allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    size_bytes: { type: DataTypes.BIGINT, allowNull: true },
    duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
    storage_key: { type: DataTypes.STRING(500), allowNull: false },
    thumbnail_url: { type: DataTypes.STRING(500), allowNull: true },
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
