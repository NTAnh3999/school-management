const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentGrade = sequelize.define(
  "AssessmentGrade",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    submission_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "assessment_submissions", key: "id" },
    },
    score: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    max_score: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    grading_status: {
      type: DataTypes.ENUM("draft", "graded"),
      allowNull: false,
      defaultValue: "draft",
    },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    grading_breakdown: { type: DataTypes.JSON, allowNull: true },
    graded_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    graded_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "assessment_grades",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentGrade;
