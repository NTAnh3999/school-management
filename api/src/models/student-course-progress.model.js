const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const StudentCourseProgress = sequelize.define(
  "StudentCourseProgress",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    completion_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.0 },
    total_time_spent_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "student_course_progress",
    timestamps: true,
    underscored: true,
  }
);

module.exports = StudentCourseProgress;
