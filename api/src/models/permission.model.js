const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Permission = sequelize.define(
  "Permission",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: false },
    module: { type: DataTypes.STRING(80), allowNull: false },
    resource: { type: DataTypes.STRING(80), allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "permissions",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["code"] }],
  }
);

module.exports = Permission;
