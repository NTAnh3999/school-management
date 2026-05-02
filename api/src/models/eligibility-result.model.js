const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const EligibilityResult = sequelize.define(
  "EligibilityResult",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    enrollment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    learner_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "courses", key: "id" },
    },
    result: {
      type: DataTypes.ENUM("eligible", "not_eligible", "pending_condition"),
      allowNull: false,
    },
    reason_code: { type: DataTypes.STRING(100), allowNull: true },
    reason_message: { type: DataTypes.TEXT, allowNull: true },
    checked_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    checked_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: "eligibility_results",
    timestamps: false,
    underscored: true,
  }
);

module.exports = EligibilityResult;
