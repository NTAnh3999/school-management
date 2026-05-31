const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const AuthService = require("../services/auth.service");
const asyncHandler = require("../utils/async-handler");

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, roleName } = req.body || {};
  const result = await AuthService.register(
    {
      email,
      password,
      fullName,
      roleName,
    },
    req
  );
  return new CreatedResponse({
    message: "Registered",
    metadata: result,
  }).send(res);
});

const login = asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.body || {};
  const result = await AuthService.login({ email, password, tenantId }, req);
  return new OKResponse({
    message: "Logged in",
    metadata: result,
  }).send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  const tokens = await AuthService.refresh(refreshToken, req);
  return new OKResponse({
    message: "Token refreshed",
    metadata: tokens,
  }).send(res);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  await AuthService.logout({ refreshToken, sessionId: req.user?.sessionId || req.user?.session_id }, req);
  return new OKResponse({ message: "Logged out" }).send(res);
});

const getTenants = asyncHandler(async (req, res) => {
  const metadata = await AuthService.getTenantMemberships(
    req.user.id,
    req.user.sessionId || req.user.session_id
  );
  return new OKResponse({ message: "Tenant memberships", metadata }).send(res);
});

const switchTenant = asyncHandler(async (req, res) => {
  const { selectedTenantId } = req.body || {};
  const metadata = await AuthService.switchTenant(
    {
      userId: req.user.id,
      sessionId: req.user.sessionId || req.user.session_id,
      selectedTenantId,
    },
    req
  );
  return new OKResponse({ message: "Tenant switched", metadata }).send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  await AuthService.forgotPassword({ email });
  // Always return 200 — never reveal whether the email exists
  return new OKResponse({
    message: "If that email is registered, a reset link has been sent.",
  }).send(res);
});
module.exports = {
  register,
  login,
  refresh,
  logout,
  getTenants,
  switchTenant,
  forgotPassword,
};
