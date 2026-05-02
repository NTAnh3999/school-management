const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Profile = sequelize.define(
  "Profile",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    profile_type: {
      type: DataTypes.ENUM("student", "parent", "teacher", "staff", "admin"),
      allowNull: false,
    },
    full_name: { type: DataTypes.STRING(120), allowNull: false },
    display_name: { type: DataTypes.STRING(120), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    contact_email: { type: DataTypes.STRING(120), allowNull: true },
    phone_number: { type: DataTypes.STRING(30), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "active", "inactive", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    visibility: {
      type: DataTypes.ENUM("internal", "public", "private"),
      allowNull: false,
      defaultValue: "internal",
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "profiles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Profile;
