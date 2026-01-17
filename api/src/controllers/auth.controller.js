const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const AuthService = require("../services/auth.service");

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, roleName } = req.body || {};
    const { token } = await AuthService.register({ email, password, fullName, roleName });
    return new CreatedResponse({ message: "Registered", metadata: { token } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const { token } = await AuthService.login({ email, password });
    return new OKResponse({ message: "Logged in", metadata: { token } }).send(res);
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    return new OKResponse({ message: "Logged out" }).send(res);
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, logout };
