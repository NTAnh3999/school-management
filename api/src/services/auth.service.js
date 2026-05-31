const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("node:crypto");
const {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthorizedError,
} = require("../utils/error-responses");
const { ROLES } = require("../constants/roles");
const { SESSION_STATUSES } = require("../constants/iam");
const { IamSession, Role, User } = require("../models");
const {
  assertUserAccountActive,
  buildUserResponse,
  ensureIamAccount,
  ensureMembership,
  ensureRoleAssignment,
  formatMembership,
  formatSession,
  formatTenant,
  getDefaultTenant,
  getRequestMeta,
  getUserWithIam,
  recordAuditLog,
  resolveActiveTenant,
  resolveAuthorizationContext,
  resolveRole,
  resolveTenantMemberships,
} = require("./iam.service");

const parseRefreshExpiryDays = () => {
  const raw = process.env.JWT_REFRESH_EXPIRES || "7d";
  const parsed = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
};

const getRefreshExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseRefreshExpiryDays());
  return expiresAt;
};

const generateRefreshToken = () => randomBytes(64).toString("hex");

const signAccessToken = (user, session, authContext) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new InternalServerError("JWT configuration missing");

  const primaryRole =
    authContext?.roles?.[0]?.name || user.role?.name || user.role || ROLES.STUDENT;

  const payload = {
    id: user.id,
    email: user.email,
    role: primaryRole,
    sessionId: session.id,
    activeTenantId: session.active_tenant_id,
    tenantContextRequired: !session.active_tenant_id,
    permissions: authContext?.permissions?.map((permission) => permission.code) || [],
  };

  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || "15m" });
};

const buildAuthResponse = async ({ user, session, memberships }) => {
  const authContext = await resolveAuthorizationContext(user, session.active_tenant_id, {
    memberships,
  });

  return {
    accessToken: signAccessToken(user, session, authContext),
    refreshToken: session.refresh_token,
    session: formatSession(session),
    tenantContextRequired: !session.active_tenant_id,
    activeTenant: formatTenant(authContext.activeTenant),
    tenants: memberships.map(formatMembership),
    user: buildUserResponse(user, {
      memberships: authContext.memberships,
      permissions: authContext.permissions,
      roles: authContext.roles,
      activeTenantId: session.active_tenant_id,
    }),
  };
};

const createSession = async ({ user, tenant, req }) => {
  const meta = getRequestMeta(req);
  return IamSession.create({
    user_id: user.id,
    active_tenant_id: tenant?.id || null,
    refresh_token: generateRefreshToken(),
    status: SESSION_STATUSES.ACTIVE,
    expires_at: getRefreshExpiryDate(),
    last_used_at: new Date(),
    user_agent: meta.userAgent,
    ip_address: meta.ipAddress,
  });
};

const register = async ({ email, password, fullName, roleName }, req) => {
  if (!email || !password || !fullName) throw new BadRequestError("Missing required fields");
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new ConflictError("Email already in use");

  const role = (await resolveRole({ roleName })) || (await resolveRole({ roleName: ROLES.STUDENT }));
  const user = await User.create({
    email,
    password_hash: await bcrypt.hash(password, 10),
    full_name: fullName,
    role_id: role.id,
  });

  await ensureIamAccount(user.id);
  const defaultTenant = await getDefaultTenant();
  if (defaultTenant) {
    await ensureMembership({ userId: user.id, tenantId: defaultTenant.id });
    await ensureRoleAssignment({
      userId: user.id,
      tenantId: defaultTenant.id,
      roleId: role.id,
    });
  }

  const freshUser = await getUserWithIam(user.id);
  await assertUserAccountActive(freshUser);
  const memberships = await resolveTenantMemberships(freshUser.id);
  const tenant = resolveActiveTenant(memberships, defaultTenant?.id || null);
  const session = await createSession({ user: freshUser, tenant, req });

  await recordAuditLog({
    actorUserId: freshUser.id,
    tenantId: tenant?.id || null,
    action: "auth.register",
    entityType: "session",
    entityId: session.id,
    details: { email },
    req,
  });

  return buildAuthResponse({ user: freshUser, session, memberships });
};

const login = async ({ email, password, tenantId }, req) => {
  if (!email || !password) throw new BadRequestError("Missing email or password");
  const user = await User.findOne({
    where: { email },
    include: [
      { model: Role, as: "role" },
      { association: "iam_account" },
    ],
  });
  if (!user) throw new UnauthorizedError("Invalid credentials", { errorCode: "AUTH_INVALID_CREDENTIAL" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new UnauthorizedError("Invalid credentials", { errorCode: "AUTH_INVALID_CREDENTIAL" });
  }

  await ensureIamAccount(user);
  const freshUser = await getUserWithIam(user.id);
  const account = await assertUserAccountActive(freshUser);
  const memberships = await resolveTenantMemberships(freshUser.id);
  const tenant = resolveActiveTenant(memberships, tenantId || null);
  const session = await createSession({ user: freshUser, tenant, req });

  account.last_login_at = new Date();
  await account.save();

  await recordAuditLog({
    actorUserId: freshUser.id,
    tenantId: tenant?.id || null,
    action: "auth.login",
    entityType: "session",
    entityId: session.id,
    details: { tenantContextRequired: !tenant },
    req,
  });

  return buildAuthResponse({ user: freshUser, session, memberships });
};

const refresh = async (token, req) => {
  if (!token) throw new BadRequestError("Refresh token is required");

  const session = await IamSession.findOne({ where: { refresh_token: token } });
  if (!session) {
    throw new UnauthorizedError("Invalid refresh token", {
      errorCode: "AUTH_REFRESH_TOKEN_INVALID",
    });
  }

  if (session.status !== SESSION_STATUSES.ACTIVE || new Date() > new Date(session.expires_at)) {
    session.status = SESSION_STATUSES.EXPIRED;
    await session.save();
    throw new UnauthorizedError("Refresh token expired", {
      errorCode: "AUTH_REFRESH_TOKEN_INVALID",
    });
  }

  const user = await getUserWithIam(session.user_id);
  await assertUserAccountActive(user);
  const memberships = await resolveTenantMemberships(user.id);

  if (
    session.active_tenant_id &&
    !memberships.some((membership) => membership.tenant_id === session.active_tenant_id)
  ) {
    throw new UnauthorizedError("Tenant membership is no longer valid", {
      errorCode: "IAM_TENANT_ACCESS_DENIED",
    });
  }

  session.refresh_token = generateRefreshToken();
  session.last_used_at = new Date();
  session.expires_at = getRefreshExpiryDate();
  await session.save();

  await recordAuditLog({
    actorUserId: user.id,
    tenantId: session.active_tenant_id,
    action: "auth.refresh",
    entityType: "session",
    entityId: session.id,
    req,
  });

  return buildAuthResponse({ user, session, memberships });
};

const logout = async ({ refreshToken, sessionId }, req) => {
  const session = await IamSession.findOne({
    where: refreshToken ? { refresh_token: refreshToken } : { id: sessionId },
  });

  if (!session) return { message: "Logged out successfully" };

  session.status = SESSION_STATUSES.REVOKED;
  session.revoked_at = new Date();
  session.revoked_reason = "logout";
  await session.save();

  await recordAuditLog({
    actorUserId: session.user_id,
    tenantId: session.active_tenant_id,
    action: "auth.logout",
    entityType: "session",
    entityId: session.id,
    req,
  });

  return { message: "Logged out successfully" };
};

const getTenantMemberships = async (userId, sessionId = null) => {
  const memberships = await resolveTenantMemberships(userId);
  const session = sessionId ? await IamSession.findByPk(sessionId) : null;
  return {
    activeTenantId: session?.active_tenant_id || null,
    tenants: memberships.map(formatMembership),
  };
};

const switchTenant = async ({ userId, sessionId, selectedTenantId }, req) => {
  if (!selectedTenantId) throw new BadRequestError("selectedTenantId is required");
  if (!sessionId) throw new UnauthorizedError("Missing active session");

  const session = await IamSession.findOne({
    where: {
      id: sessionId,
      user_id: userId,
      status: SESSION_STATUSES.ACTIVE,
    },
  });
  if (!session) throw new UnauthorizedError("Session revoked", { errorCode: "AUTH_SESSION_REVOKED" });

  const user = await getUserWithIam(userId);
  await assertUserAccountActive(user);
  const memberships = await resolveTenantMemberships(userId);
  const tenant = resolveActiveTenant(memberships, selectedTenantId);

  session.active_tenant_id = tenant.id;
  session.last_used_at = new Date();
  await session.save();

  await recordAuditLog({
    actorUserId: user.id,
    tenantId: tenant.id,
    action: "auth.switch_tenant",
    entityType: "session",
    entityId: session.id,
    details: { selectedTenantId: tenant.id },
    req,
  });

  return buildAuthResponse({ user, session, memberships });
};

const forgotPassword = async ({ email }) => {
  if (!email) throw new BadRequestError("Email is required");
  const user = await User.findOne({ where: { email } });
  if (!user) return;
  console.log(`[forgotPassword] Reset requested for: ${email}`);
};

module.exports = {
  forgotPassword,
  getTenantMemberships,
  login,
  logout,
  refresh,
  register,
  switchTenant,
};
