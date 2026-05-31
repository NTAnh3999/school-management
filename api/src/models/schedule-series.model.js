"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ScheduleSeries = sequelize.define(
  "ScheduleSeries",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classrooms", key: "id" },
    },
    recurrence_rule: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'e.g. {type:"weekly", days:["mon","wed","fri"]}',
    },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    location: { type: DataTypes.STRING(255), allowNull: true },
    delivery_mode: {
      type: DataTypes.ENUM("Offline", "Online", "Hybrid"),
      allowNull: false,
      defaultValue: "Offline",
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "schedule_series",
    timestamps: true,
    underscored: true,
    defaultScope: { where: { is_deleted: false } },
    scopes: { withDeleted: { where: {} } },
  }
);

module.exports = ScheduleSeries;
