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
      let userRole =
        normalizeRole(req.user?.role) ||
        normalizeRole(req.user?.roleName) ||
        normalizeRole(req.user?.role_name);

      // Fallback: decode Bearer token if role not present on req.user
      if (!userRole) {
        const token = getTokenFromHeader(req);
        if (!token) return next(new UnauthorizedError("Missing Bearer token"));
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          userRole =
            normalizeRole(payload?.role) ||
            normalizeRole(payload?.roleName) ||
            normalizeRole(payload?.role_name);
          req.user = {
            ...(req.user || payload),
            role: userRole || payload?.role || payload?.roleName || payload?.role_name,
          };
        } catch (err) {
          if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return next(new UnauthorizedError("Invalid or expired token"));
          }
          return next(err);
        }
      }

      if (!userRole) return next(new ForbiddenError("Role missing in token"));
      req.user = { ...(req.user || {}), role: userRole };
      if (!hasRole(userRole, allowedRoles)) {
        return next(new ForbiddenError("Insufficient permissions"));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };

module.exports = { requireRole };
