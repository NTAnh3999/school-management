const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { CAMPUS_STATUSES } = require("../constants/org-structure");

const Campus = sequelize.define(
  "Campus",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    branch_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "branches", key: "id" },
    },
    campus_code: { type: DataTypes.STRING(50), allowNull: false },
    campus_name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(CAMPUS_STATUSES)),
      allowNull: false,
      defaultValue: CAMPUS_STATUSES.ACTIVE,
    },
  },
  {
    tableName: "campuses",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["branch_id", "campus_code"] }],
  }
);

module.exports = Campus;
