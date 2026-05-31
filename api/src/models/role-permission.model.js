const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
    permission_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "permissions", key: "id" },
    },
  },
  {
    tableName: "role_permissions",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["role_id", "permission_id"] }],
  }
);

module.exports = RolePermission;
