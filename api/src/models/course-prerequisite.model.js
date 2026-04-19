const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const CoursePrerequisite = sequelize.define(
  "CoursePrerequisite",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    prerequisite_course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    prerequisite_type: {
      type: DataTypes.ENUM("ALL", "ANY"),
      allowNull: false,
      defaultValue: "ALL",
    },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "course_prerequisites",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CoursePrerequisite;
