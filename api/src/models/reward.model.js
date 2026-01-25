const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Reward = sequelize.define(
  "Reward",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    reward_type: {
      type: DataTypes.ENUM("certificate", "badge", "points"),
      defaultValue: "badge",
    },
    points_value: { type: DataTypes.INTEGER, defaultValue: 0 },
    icon_url: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "rewards",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Reward;
