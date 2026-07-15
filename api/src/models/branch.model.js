const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { BRANCH_STATUSES } = require("../constants/org-structure");

const Branch = sequelize.define(
  "Branch",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    branch_code: { type: DataTypes.STRING(50), allowNull: false },
    branch_name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(BRANCH_STATUSES)),
      allowNull: false,
      defaultValue: BRANCH_STATUSES.ACTIVE,
    },
  },
  {
    tableName: "branches",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["tenant_id", "branch_code"] }],
  }
);

module.exports = Branch;
