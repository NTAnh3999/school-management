const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const User = require("./user.model");

const Course = sequelize.define(
  "Course",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    teacher_id: {
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

Course.belongsTo(User, { foreignKey: "teacher_id", as: "teacher" });
User.hasMany(Course, { foreignKey: "teacher_id", as: "courses" });

module.exports = Course;
