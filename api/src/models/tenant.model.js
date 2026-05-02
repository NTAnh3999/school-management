const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Tenant = sequelize.define(
  "Tenant",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    tenant_name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "tenants",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Tenant;
