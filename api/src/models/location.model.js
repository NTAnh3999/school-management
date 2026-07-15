const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { LOCATION_STATUSES, LOCATION_TYPES } = require("../constants/org-structure");

const Location = sequelize.define(
  "Location",
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
    campus_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "campuses", key: "id" },
    },
    parent_location_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "locations", key: "id" },
    },
    location_code: { type: DataTypes.STRING(50), allowNull: false },
    location_name: { type: DataTypes.STRING(255), allowNull: false },
    location_type: {
      type: DataTypes.ENUM(...Object.values(LOCATION_TYPES)),
      allowNull: false,
      defaultValue: LOCATION_TYPES.ROOM,
    },
    capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(LOCATION_STATUSES)),
      allowNull: false,
      defaultValue: LOCATION_STATUSES.ACTIVE,
    },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "locations",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["campus_id", "location_code"] }],
  }
);

module.exports = Location;
