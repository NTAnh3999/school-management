const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Department = sequelize.define(
  "Department",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    department_code: { type: DataTypes.STRING(50), allowNull: false },
    department_name: { type: DataTypes.STRING(255), allowNull: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "departments",
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: { is_deleted: false },
    },
    scopes: {
      withDeleted: { where: {} },
    },
    indexes: [{ unique: true, fields: ["tenant_id", "department_code"] }],
  }
);

module.exports = Department;
