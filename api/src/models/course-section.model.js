const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const CourseSection = sequelize.define(
  "CourseSection",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "course_sections",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CourseSection;
