const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { MEMBERSHIP_STATUSES, SCOPE_TYPES } = require("../constants/iam");

const IamMembership = sequelize.define(
  "IamMembership",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
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
    branch_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "branches", key: "id" },
    },
    campus_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "campuses", key: "id" },
    },
    location_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "locations", key: "id" },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MEMBERSHIP_STATUSES)),
      allowNull: false,
      defaultValue: MEMBERSHIP_STATUSES.ACTIVE,
    },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "iam_memberships",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["tenant_id"] },
      {
        name: "iam_memberships_unique_scope",
        unique: true,
        fields: ["user_id", "tenant_id", "scope_type", "branch_id", "campus_id", "location_id"],
      },
    ],
  }
);

module.exports = IamMembership;
