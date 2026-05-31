const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentSubmission = sequelize.define(
  "AssessmentSubmission",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    attempt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "quiz_attempts", key: "id" },
    },
    submission_payload: { type: DataTypes.JSON, allowNull: true },
    submission_status: {
      type: DataTypes.ENUM("submitted", "invalid"),
      allowNull: false,
      defaultValue: "submitted",
    },
    submitted_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "assessment_submissions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentSubmission;
