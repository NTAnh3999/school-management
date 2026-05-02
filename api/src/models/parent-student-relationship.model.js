const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ParentStudentRelationship = sequelize.define(
  "ParentStudentRelationship",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    parent_profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "parent_profiles", key: "id" },
    },
    student_profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "student_profiles", key: "id" },
    },
    relationship_type: {
      type: DataTypes.ENUM("father", "mother", "guardian", "other"),
      allowNull: false,
      defaultValue: "guardian",
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended", "revoked"),
      allowNull: false,
      defaultValue: "pending",
    },
    start_date: { type: DataTypes.DATE, allowNull: true },
    end_date: { type: DataTypes.DATE, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "parent_student_relationships",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ParentStudentRelationship;
