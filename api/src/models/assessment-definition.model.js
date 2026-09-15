"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentDefinition = sequelize.define(
  "AssessmentDefinition",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    assessment_type: {
      type: DataTypes.ENUM("quiz", "assignment", "exam", "survey", "other"),
      allowNull: false,
      defaultValue: "quiz",
    },
    owner_scope_type: {
      type: DataTypes.ENUM("tenant", "course", "classroom"),
      allowNull: false,
      defaultValue: "course",
    },
    owner_scope_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    current_published_version_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    legacy_quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      unique: true,
      references: { model: "quizzes", key: "id" },
    },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "assessment_definitions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentDefinition;
