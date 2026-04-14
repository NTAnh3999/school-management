const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/error-responses");
const { normalizeRole } = require("../constants/roles");

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const verifyToken = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) throw new UnauthorizedError("Missing Bearer token");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const normalizedRole =
      normalizeRole(payload?.role) ||
      normalizeRole(payload?.roleName) ||
      normalizeRole(payload?.role_name);

    req.user = {
      ...payload,
      role: normalizedRole || payload?.role || payload?.roleName || payload?.role_name,
    };
    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    return next(err);
  }
};

module.exports = { verifyToken };
