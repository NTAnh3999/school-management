"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ScheduleChangeRecord = sequelize.define(
  "ScheduleChangeRecord",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    session_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classroom_sessions", key: "id" },
    },
    series_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "schedule_series", key: "id" },
    },
    change_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment:
        "time_change|location_change|teacher_change|cancel|reschedule|live_metadata|delivery_mode_change",
    },
    old_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    batch_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "Groups multi-session reschedule operations",
    },
    changed_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "schedule_change_records",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

module.exports = ScheduleChangeRecord;
