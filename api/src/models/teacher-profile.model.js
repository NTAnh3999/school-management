const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");

const TeacherProfile = sequelize.define(
  "TeacherProfile",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    profile_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "profiles", key: "id" },
    },
    teacher_code: { type: DataTypes.STRING(50), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    expertise: { type: DataTypes.JSON, allowNull: true },
    qualification: { type: DataTypes.TEXT, allowNull: true },
    years_of_experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    public_profile_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "teacher_profiles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = TeacherProfile;
