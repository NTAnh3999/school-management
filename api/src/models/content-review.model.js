"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ContentReview = sequelize.define(
  "ContentReview",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    content_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "content_versions", key: "id" },
    },
    decided_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    decision: {
      type: DataTypes.ENUM("APPROVED", "CHANGES_REQUESTED"),
      allowNull: false,
    },
    // Required when decision = CHANGES_REQUESTED; enforced at the service layer, not the DB,
    // consistent with how other conditional-required fields are handled in this codebase.
    comment: { type: DataTypes.TEXT, allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "content_reviews",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ContentReview;
