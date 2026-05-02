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
      type: DataTypes.ENUM(
        "pending",
        "active",
        "suspended",
        "cancelled",
        "completed",
        "rejected",
        "waitlisted"
      ),
      defaultValue: "pending",
    },
    request_source: {
      type: DataTypes.ENUM("student", "parent", "admin", "system", "import"),
      defaultValue: "student",
    },
    payment_reference: { type: DataTypes.STRING(100), allowNull: true },
    eligibility_result_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    requested_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activated_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    enrolled_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "enrollments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Enrollment;
