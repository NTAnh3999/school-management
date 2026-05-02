const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const STATUS_ENUM = [
  "pending",
  "active",
  "suspended",
  "cancelled",
  "completed",
  "rejected",
  "waitlisted",
];

const EnrollmentHistory = sequelize.define(
  "EnrollmentHistory",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    from_status: {
      type: DataTypes.ENUM(...STATUS_ENUM),
      allowNull: true,
    },
    to_status: {
      type: DataTypes.ENUM(...STATUS_ENUM),
      allowNull: false,
    },
    reason_code: { type: DataTypes.STRING(100), allowNull: true },
    reason_message: { type: DataTypes.TEXT, allowNull: true },
    source: {
      type: DataTypes.ENUM("admin", "user", "system", "billing_event", "import"),
      allowNull: false,
      defaultValue: "admin",
    },
    source_reference: { type: DataTypes.STRING(100), allowNull: true },
    changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    changed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "enrollment_histories",
    timestamps: false,
    underscored: true,
  }
);

module.exports = EnrollmentHistory;
