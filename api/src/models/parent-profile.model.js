const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const ParentProfile = sequelize.define(
  "ParentProfile",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "profiles", key: "id" },
    },
    parent_code: { type: DataTypes.STRING(50), allowNull: true },
    occupation: { type: DataTypes.STRING(150), allowNull: true },
    contact_priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    emergency_contact_flag: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "parent_profiles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ParentProfile;
