const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const CourseReview = sequelize.define(
  "CourseReview",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    review_text: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "course_reviews",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CourseReview;
