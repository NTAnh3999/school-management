const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const Role = require("./role.model");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(200), allowNull: false },
    full_name: { type: DataTypes.STRING(120), allowNull: false },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "roles", key: "id" },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(User, { foreignKey: "role_id", as: "users" });

module.exports = User;
