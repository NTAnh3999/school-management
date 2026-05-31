"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const LiveSessionMetadata = sequelize.define(
  "LiveSessionMetadata",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    session_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "classroom_sessions", key: "id" },
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Zoom|GoogleMeet|Teams|Internal",
    },
    room_id: { type: DataTypes.STRING(255), allowNull: true },
    join_url: { type: DataTypes.STRING(2000), allowNull: true },
    host_url: { type: DataTypes.STRING(2000), allowNull: true },
    access_policy: { type: DataTypes.JSON, allowNull: true },
    provider_status: {
      type: DataTypes.ENUM("Created", "Pending", "Failed"),
      allowNull: false,
      defaultValue: "Pending",
    },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "live_session_metadata",
    timestamps: true,
    underscored: true,
  }
);

module.exports = LiveSessionMetadata;
