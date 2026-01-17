const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/error-responses");

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
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    return next(err);
  }
};

module.exports = { verifyToken };
