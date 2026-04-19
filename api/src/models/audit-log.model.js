const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    entity_name: { type: DataTypes.STRING(100), allowNull: false },
    entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    action: {
      type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE", "CHANGE_STATUS", "IMPORT", "EXPORT"),
      allowNull: false,
    },
    old_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
    changed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "audit_logs",
    timestamps: false,
    underscored: true,
  }
);

module.exports = AuditLog;
