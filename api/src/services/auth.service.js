const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("node:crypto");
const { Op } = require("sequelize");
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  InternalServerError,
} = require("../utils/error-responses");
const { User, RefreshToken } = require("../models");
const Role = require("../models/role.model");

const signAccessToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role?.name };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new InternalServerError("JWT configuration missing");
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || "15m" });
};

const formatUser = (userInstance) => {
  if (!userInstance) return null;
  const raw =
    typeof userInstance.get === "function" ? userInstance.get({ plain: true }) : userInstance;
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.full_name || raw.fullName,
    role: raw.role?.name || raw.role,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
};

const generateRefreshToken = async (userId) => {
  const token = randomBytes(64).toString("hex");
  const expiresAt = new Date();
  const expiryDays = parseInt(process.env.JWT_REFRESH_EXPIRES?.replace("d", "") || "7");
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  await RefreshToken.create({
    token,
    user_id: userId,
    expires_at: expiresAt,
  });

  return token;
};

const cleanupExpiredTokens = async (userId) => {
  await RefreshToken.destroy({
    where: {
      user_id: userId,
      expires_at: { [Op.lt]: new Date() },
    },
  });
};

const register = async ({ email, password, fullName, roleName }) => {
  if (!email || !password || !fullName) throw new BadRequestError("Missing required fields");
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new ConflictError("Email already in use");
  const hash = await bcrypt.hash(password, 10);
  const role = await Role.findOne({ where: { name: roleName || "student" } });
  if (!role) throw new BadRequestError("Invalid role");
  const user = await User.create({
    email,
    password_hash: hash,
    full_name: fullName,
    role_id: role.id,
  });
  const freshUser = await User.findByPk(user.id, {
    include: [{ model: Role, as: "role" }],
  });
  await cleanupExpiredTokens(user.id);
  const accessToken = signAccessToken(freshUser);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken, user: formatUser(freshUser) };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new BadRequestError("Missing email or password");
  const user = await User.findOne({ where: { email }, include: [{ model: Role, as: "role" }] });
  if (!user) throw new UnauthorizedError("Invalid credentials");
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new UnauthorizedError("Invalid credentials");

  await cleanupExpiredTokens(user.id);
  const accessToken = signAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken, user: formatUser(user) };
};

const refresh = async (token) => {
  if (!token) throw new BadRequestError("Refresh token is required");

  const refreshTokenRecord = await RefreshToken.findOne({
    where: { token },
    include: [{ model: User, as: "user", include: [{ model: Role, as: "role" }] }],
  });

  if (!refreshTokenRecord) throw new UnauthorizedError("Invalid refresh token");

  if (new Date() > new Date(refreshTokenRecord.expires_at)) {
    await refreshTokenRecord.destroy();
    throw new UnauthorizedError("Refresh token expired");
  }

  // Rotate refresh token for security
  await refreshTokenRecord.destroy();
  await cleanupExpiredTokens(refreshTokenRecord.user_id);

  const accessToken = signAccessToken(refreshTokenRecord.user);
  const newRefreshToken = await generateRefreshToken(refreshTokenRecord.user_id);

  return { accessToken, refreshToken: newRefreshToken, user: formatUser(refreshTokenRecord.user) };
};

const logout = async (token) => {
  if (token) {
    await RefreshToken.destroy({ where: { token } });
  }
  return { message: "Logged out successfully" };
};

module.exports = { register, login, refresh, logout };
