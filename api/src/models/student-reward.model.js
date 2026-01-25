const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const StudentReward = sequelize.define(
  "StudentReward",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    reward_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "rewards", key: "id" },
    },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "enrollments", key: "id" },
    },
    earned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "student_rewards",
    timestamps: true,
    underscored: true,
  }
);

module.exports = StudentReward;
