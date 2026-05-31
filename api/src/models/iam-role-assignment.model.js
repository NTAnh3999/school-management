const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { ROLE_ASSIGNMENT_STATUSES, SCOPE_TYPES } = require("../constants/iam");

const IamRoleAssignment = sequelize.define(
  "IamRoleAssignment",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    scope_type: {
      type: DataTypes.ENUM(...Object.values(SCOPE_TYPES)),
      allowNull: false,
      defaultValue: SCOPE_TYPES.TENANT,
    },
    scope_ref_id: { type: DataTypes.STRING(100), allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(ROLE_ASSIGNMENT_STATUSES)),
      allowNull: false,
      defaultValue: ROLE_ASSIGNMENT_STATUSES.ACTIVE,
    },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    assigned_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "iam_role_assignments",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["tenant_id"] },
      { unique: true, fields: ["user_id", "role_id", "tenant_id", "scope_type", "scope_ref_id"] },
    ],
  }
);

module.exports = IamRoleAssignment;
