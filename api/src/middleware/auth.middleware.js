const jwt = require("jsonwebtoken");
const { ForbiddenError, UnauthorizedError } = require("../utils/error-responses");
const { normalizeRole } = require("../constants/roles");
const { IamSession } = require("../models");
const {
  assertUserAccountActive,
  getUserWithIam,
  resolveAuthorizationContext,
  SESSION_STATUSES,
} = require("../services/iam.service");

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const decodeToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const buildLegacyUser = (payload) => {
  const normalizedRole =
    normalizeRole(payload?.role) ||
    normalizeRole(payload?.roleName) ||
    normalizeRole(payload?.role_name);

  return {
    ...payload,
    role: normalizedRole || payload?.role || payload?.roleName || payload?.role_name,
  };
};

const buildIamUser = async (payload) => {
  const sessionId = payload?.sessionId || payload?.session_id;
  if (!sessionId) return buildLegacyUser(payload);

  const session = await IamSession.findByPk(sessionId);
  if (!session || session.status !== SESSION_STATUSES.ACTIVE) {
    throw new UnauthorizedError("Session revoked", { errorCode: "AUTH_SESSION_REVOKED" });
  }

  if (new Date() > new Date(session.expires_at)) {
    session.status = SESSION_STATUSES.EXPIRED;
    await session.save();
    throw new UnauthorizedError("Session expired", { errorCode: "AUTH_REFRESH_TOKEN_INVALID" });
  }

  const user = await getUserWithIam(session.user_id);
  await assertUserAccountActive(user);

  const authContext = await resolveAuthorizationContext(user, session.active_tenant_id || null);
  if (session.active_tenant_id && !authContext.activeMemberships.length) {
    throw new ForbiddenError("Tenant access denied", { errorCode: "IAM_TENANT_ACCESS_DENIED" });
  }

  session.last_used_at = new Date();
  await session.save();

  return {
    id: user.id,
    email: user.email,
    role: authContext.roles?.[0]?.name || buildLegacyUser(payload).role,
    sessionId: session.id,
    activeTenantId: session.active_tenant_id,
    tenantContextRequired: !session.active_tenant_id,
    memberships: authContext.memberships,
    roles: authContext.roles,
    permissions: authContext.permissions,
  };
};

const verifyToken = async (req, res, next) => {
  try {
    void res;
    const token = getTokenFromHeader(req);
    if (!token) throw new UnauthorizedError("Missing Bearer token");
    const payload = decodeToken(token);
    req.user = await buildIamUser(payload);
    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    return next(err);
  }
};

const optionalToken = async (req, res, next) => {
  try {
    void res;
    const token = getTokenFromHeader(req);
    if (!token) return next();
    const payload = decodeToken(token);
    req.user = await buildIamUser(payload);
  } catch {
    // Ignore invalid optional tokens
  }
  return next();
};

module.exports = { verifyToken, optionalToken };
