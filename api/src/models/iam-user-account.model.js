const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { ACCOUNT_STATUSES } = require("../constants/iam");

const IamUserAccount = sequelize.define(
  "IamUserAccount",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },
    username: { type: DataTypes.STRING(120), allowNull: true, unique: true },
    phone: { type: DataTypes.STRING(30), allowNull: true, unique: true },
    status: {
      type: DataTypes.ENUM(...Object.values(ACCOUNT_STATUSES)),
      allowNull: false,
      defaultValue: ACCOUNT_STATUSES.ACTIVE,
    },
    login_methods: { type: DataTypes.JSON, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "iam_user_accounts",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }, { fields: ["username"] }, { fields: ["phone"] }],
  }
);

module.exports = IamUserAccount;
