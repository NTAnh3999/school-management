const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  InternalServerError,
} = require("../utils/error-responses");
const { User } = require("../models");
const Role = require("../models/role.model");

const signToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role?.name };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new InternalServerError("JWT configuration missing");
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || "7d" });
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
  const token = signToken({ ...user.get(), role });
  return { token };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new BadRequestError("Missing email or password");
  const user = await User.findOne({ where: { email }, include: [{ model: Role, as: "role" }] });
  if (!user) throw new UnauthorizedError("Invalid credentials");
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new UnauthorizedError("Invalid credentials");
  const token = signToken(user);
  return { token };
};

module.exports = { register, login };
