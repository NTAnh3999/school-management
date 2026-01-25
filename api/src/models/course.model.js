const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Course = sequelize.define(
  "Course",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      defaultValue: "beginner",
    },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      defaultValue: "draft",
    },
    instructor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "courses",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Course;
