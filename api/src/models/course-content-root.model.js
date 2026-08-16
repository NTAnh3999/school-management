"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

// Authoring root per Course. tenant_id has no direct source on Course (Course is a global
// catalog with no tenant_id column) -- it is derived transitively via Course.department.tenant_id
// at creation time and denormalized here for fast tenant-scoped queries.
const CourseContentRoot = sequelize.define(
  "CourseContentRoot",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "tenants", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "courses", key: "id" },
    },
    current_published_version_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "content_versions", key: "id" },
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "course_content_roots",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CourseContentRoot;
