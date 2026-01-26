const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const AuthService = require("../services/auth.service");
const asyncHandler = require("../utils/async-handler");

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, roleName } = req.body || {};
  const { accessToken, refreshToken, user } = await AuthService.register({
    email,
    password,
    fullName,
    roleName,
  });
  return new CreatedResponse({
    message: "Registered",
    metadata: { accessToken, refreshToken, user },
  }).send(res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const { accessToken, refreshToken, user } = await AuthService.login({ email, password });
  return new OKResponse({
    message: "Logged in",
    metadata: { accessToken, refreshToken, user },
  }).send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  const tokens = await AuthService.refresh(refreshToken);
  return new OKResponse({
    message: "Token refreshed",
    metadata: tokens,
  }).send(res);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  await AuthService.logout(refreshToken);
  return new OKResponse({ message: "Logged out" }).send(res);
});

module.exports = { register, login, refresh, logout };
