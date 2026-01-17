const { ForbiddenError } = require("../utils/error-responses");

const requireRole =
  (roles = []) =>
  (req, res, next) => {
    try {
      const userRole = req.user?.role || req.user?.roleName || req.user?.role_name;
      if (!userRole) return next(new ForbiddenError("Role missing in token"));
      if (!roles.includes(userRole)) return next(new ForbiddenError("Insufficient permissions"));
      return next();
    } catch (err) {
      return next(err);
    }
  };

module.exports = { requireRole };
