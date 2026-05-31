const { DataTypes } = require("sequelize");
const sequelize = require("../database/init.mysql.js");
const { SESSION_STATUSES } = require("../constants/iam");

const IamSession = sequelize.define(
  "IamSession",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    active_tenant_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: "tenants", key: "id" },
    },
    refresh_token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...Object.values(SESSION_STATUSES)),
      allowNull: false,
      defaultValue: SESSION_STATUSES.ACTIVE,
    },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    last_used_at: { type: DataTypes.DATE, allowNull: true },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
    revoked_reason: { type: DataTypes.STRING(255), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "iam_sessions",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }, { fields: ["active_tenant_id"] }, { fields: ["status"] }],
  }
);

module.exports = IamSession;
