const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentAuditLog = sequelize.define(
  "AssessmentAuditLog",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    assessment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "quizzes", key: "id" },
    },
    attempt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "quiz_attempts", key: "id" },
    },
    submission_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "assessment_submissions", key: "id" },
    },
    grade_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "assessment_grades", key: "id" },
    },
    publication_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "assessment_result_publications", key: "id" },
    },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    actor_user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    actor_role: { type: DataTypes.STRING(50), allowNull: true },
    request_id: { type: DataTypes.STRING(120), allowNull: true },
    ip_address: { type: DataTypes.STRING(80), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    old_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "assessment_audit_logs",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentAuditLog;
