const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const IamAuditLog = sequelize.define(
  "IamAuditLog",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    actor_user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "tenants", key: "id" },
    },
    action: { type: DataTypes.STRING(120), allowNull: false },
    entity_type: { type: DataTypes.STRING(80), allowNull: false },
    entity_id: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "success" },
    details: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "iam_audit_logs",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["actor_user_id"] }, { fields: ["tenant_id"] }, { fields: ["action"] }],
  }
);

module.exports = IamAuditLog;
