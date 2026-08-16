"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

// Course-level "assigned author" -- modeled on classroom-teacher.model.js's join-table pattern.
// Revocation is soft (active_flag=false), never a row delete, so assignment history is preserved.
const CourseAuthor = sequelize.define(
  "CourseAuthor",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    role_in_course: {
      type: DataTypes.ENUM("primary_author", "co_author"),
      allowNull: false,
      defaultValue: "primary_author",
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
    tableName: "course_authors",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["course_id", "user_id"] }],
  }
);

module.exports = CourseAuthor;
