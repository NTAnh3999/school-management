const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const AssessmentResultPublication = sequelize.define(
  "AssessmentResultPublication",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    grade_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "assessment_grades", key: "id" },
    },
    publication_status: {
      type: DataTypes.ENUM("not_published", "published", "unpublished"),
      allowNull: false,
      defaultValue: "not_published",
    },
    scheduled_publish_at: { type: DataTypes.DATE, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    published_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "assessment_result_publications",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssessmentResultPublication;
