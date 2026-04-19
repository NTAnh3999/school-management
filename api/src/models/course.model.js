const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const Course = sequelize.define(
  "Course",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "departments", key: "id" },
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    course_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "general" },
    credit: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    duration_hours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      defaultValue: "beginner",
    },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
    status: {
      type: DataTypes.ENUM("draft", "active", "inactive", "archived"),
      defaultValue: "draft",
    },
    effective_from: { type: DataTypes.DATEONLY, allowNull: true },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    teacher_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "courses",
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: { is_deleted: false },
    },
    scopes: {
      withDeleted: { where: {} },
    },
  }
);

module.exports = Course;
