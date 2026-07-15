const jwt = require("jsonwebtoken");
const { ForbiddenError, UnauthorizedError } = require("../utils/error-responses");
const { hasRole, normalizeRole, normalizeRoles } = require("../constants/roles");

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const requireRole =
  (roles = []) =>
  (req, res, next) => {
    try {
      const allowedRoles = normalizeRoles(roles);

      // Defensive fallback only for routes that forgot to attach verifyToken —
      // req.user is populated fresh from the DB (via resolveAuthorizationContext)
      // on every request by auth.middleware.js, so it must never be second-guessed
      // by re-decoding the raw JWT once it exists.
      if (!req.user) {
        const token = getTokenFromHeader(req);
        if (!token) return next(new UnauthorizedError("Missing Bearer token"));
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          req.user = { ...payload, role: normalizeRole(payload?.role) || payload?.role };
        } catch (err) {
          if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return next(new UnauthorizedError("Invalid or expired token"));
          }
          return next(err);
        }
      }

      if (req.user.tenantContextRequired) {
        return next(
          new ForbiddenError("Select an active tenant before performing this action", {
            errorCode: "IAM_TENANT_CONTEXT_REQUIRED",
          })
        );
      }

      const userRole = normalizeRole(req.user.role);
      if (!userRole) {
        return next(
          new ForbiddenError("No active role assigned for the current tenant", {
            errorCode: "IAM_NO_ACTIVE_ROLE",
          })
        );
      }

      if (!hasRole(userRole, allowedRoles)) {
        return next(new ForbiddenError("Insufficient permissions"));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };

module.exports = { requireRole };
