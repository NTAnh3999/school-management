const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const StudentProfile = sequelize.define(
  "StudentProfile",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "profiles", key: "id" },
    },
    student_code: { type: DataTypes.STRING(50), allowNull: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
    gender: {
      type: DataTypes.ENUM("male", "female", "other", "unspecified"),
      allowNull: true,
    },
    current_level: { type: DataTypes.STRING(100), allowNull: true },
    learning_goal: { type: DataTypes.TEXT, allowNull: true },
    student_status: {
      type: DataTypes.ENUM("active", "inactive", "graduated", "suspended"),
      allowNull: true,
    },
  },
  {
    tableName: "student_profiles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = StudentProfile;
