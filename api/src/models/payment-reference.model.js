const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const PaymentReference = sequelize.define(
  "PaymentReference",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "enrollments", key: "id" },
    },
    billing_reference: { type: DataTypes.STRING(100), allowNull: false },
    payment_condition_status: {
      type: DataTypes.ENUM("required", "confirmed", "failed", "expired"),
      allowNull: false,
      defaultValue: "required",
    },
    confirmed_at: { type: DataTypes.DATE, allowNull: true },
    event_id: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    tableName: "payment_references",
    timestamps: true,
    underscored: true,
  }
);

module.exports = PaymentReference;
