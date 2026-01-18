const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const AuthService = require("../services/auth.service");
const asyncHandler = require("../utils/async-handler");

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, roleName } = req.body || {};
  const { token } = await AuthService.register({ email, password, fullName, roleName });
  return new CreatedResponse({ message: "Registered", metadata: { token } }).send(res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const { token } = await AuthService.login({ email, password });
  return new OKResponse({ message: "Logged in", metadata: { token } }).send(res);
});

const logout = asyncHandler(async (req, res) => {
  return new OKResponse({ message: "Logged out" }).send(res);
});

module.exports = { register, login, logout };
