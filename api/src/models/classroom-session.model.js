"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ClassroomSession = sequelize.define(
  "ClassroomSession",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classrooms", key: "id" },
    },
    session_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    session_title: { type: DataTypes.STRING(255), allowNull: true },
    session_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    location: { type: DataTypes.STRING(255), allowNull: true },
    online_meeting_link: { type: DataTypes.STRING(500), allowNull: true },
    status: {
      type: DataTypes.ENUM("scheduled", "completed", "cancelled", "rescheduled"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    // Tracks original schedule if rescheduled
    original_date: { type: DataTypes.DATEONLY, allowNull: true },
    original_start_time: { type: DataTypes.TIME, allowNull: true },
    original_end_time: { type: DataTypes.TIME, allowNull: true },
  },
  {
    tableName: "classroom_sessions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ClassroomSession;
