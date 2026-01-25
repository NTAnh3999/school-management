const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Enrollment = sequelize.define(
  "Enrollment",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "dropped"),
      defaultValue: "active",
    },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "enrollments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Enrollment;
