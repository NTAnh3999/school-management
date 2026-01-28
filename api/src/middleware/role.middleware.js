const jwt = require("jsonwebtoken");
const { ForbiddenError, UnauthorizedError } = require("../utils/error-responses");

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
      let userRole = req.user?.role || req.user?.roleName || req.user?.role_name;

      // Fallback: decode Bearer token if role not present on req.user
      if (!userRole) {
        const token = getTokenFromHeader(req);
        if (!token) return next(new UnauthorizedError("Missing Bearer token"));
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          // Attach payload to req.user if not already set
          req.user = req.user || payload;
          userRole = payload?.role || payload?.roleName || payload?.role_name;
        } catch (err) {
          if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return next(new UnauthorizedError("Invalid or expired token"));
          }
          return next(err);
        }
      }

      if (!userRole) return next(new ForbiddenError("Role missing in token"));
      if (!roles.includes(userRole)) return next(new ForbiddenError("Insufficient permissions"));
      return next();
    } catch (err) {
      return next(err);
    }
  };

module.exports = { requireRole };
