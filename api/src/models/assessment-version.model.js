"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentVersion = sequelize.define(
  "AssessmentVersion",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    assessment_definition_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "assessment_definitions", key: "id" },
    },
    legacy_quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      unique: true,
      references: { model: "quizzes", key: "id" },
    },
    version_no: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM("draft", "published", "retired"),
      allowNull: false,
      defaultValue: "draft",
    },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    max_score: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    pass_threshold: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    grading_method: {
      type: DataTypes.ENUM("auto", "manual", "hybrid"),
      allowNull: false,
      defaultValue: "auto",
    },
    question_snapshot: { type: DataTypes.JSON, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    published_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "assessment_versions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["assessment_definition_id", "version_no"],
      },
    ],
  }
);

module.exports = AssessmentVersion;
