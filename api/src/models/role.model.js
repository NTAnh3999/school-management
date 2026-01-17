const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Role = sequelize.define(
  "Role",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  },
  {
    tableName: "roles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Role;
