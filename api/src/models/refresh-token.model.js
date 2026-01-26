const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    expires_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["token"] }, { fields: ["user_id"] }],
  }
);

module.exports = RefreshToken;
