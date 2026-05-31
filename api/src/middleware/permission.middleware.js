const { ForbiddenError } = require("../utils/error-responses");

const requirePermission = (permissionCode) => (req, res, next) => {
  void res;
  if (req.user?.tenantContextRequired) {
    return next(
      new ForbiddenError("Tenant context is required", {
        errorCode: "IAM_TENANT_CONTEXT_REQUIRED",
      })
    );
  }

  const hasPermission = Boolean(
    req.user?.permissions?.some((permission) => permission.code === permissionCode)
  );

  if (!hasPermission) {
    return next(new ForbiddenError("Permission denied", { errorCode: "IAM_PERMISSION_DENIED" }));
  }

  return next();
};

module.exports = { requirePermission };
