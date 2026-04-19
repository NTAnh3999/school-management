const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Department = sequelize.define(
  "Department",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    department_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    department_name: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    tableName: "departments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Department;
