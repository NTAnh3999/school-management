"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ClassroomTeacher = sequelize.define(
  "ClassroomTeacher",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    classroom_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classrooms", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    role_in_classroom: {
      type: DataTypes.ENUM("main_teacher", "co_teacher", "teaching_assistant"),
      allowNull: false,
      defaultValue: "main_teacher",
    },
    assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    assigned_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    active_flag: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "classroom_teachers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ClassroomTeacher;
