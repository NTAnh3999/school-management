const { ForbiddenError } = require("../utils/error-responses");
const { authorizeAccess } = require("../services/iam.service");

/**
 * @param {string} permissionCode
 * @param {(req: import('express').Request) => (Promise<object|object[]|null>|object|object[]|null)} [resolveScope]
 *   Optional. Returns the target's {scopeType, branchId, campusId, locationId} (or null if this
 *   particular request has no specific scope to check), or an ARRAY of such targets when a single
 *   request could touch several scopes at once (e.g. updating a user who holds memberships at
 *   multiple scopes) — every target in the array must be covered. Requests are authorized via the
 *   same scopeCovers hierarchy logic used by POST /iam/authorize, instead of just checking that
 *   the user holds the permission code ANYWHERE in the tenant.
 */
const requirePermission = (permissionCode, resolveScope) => (req, res, next) => {
  void res;
  if (req.user?.tenantContextRequired) {
    return next(
      new ForbiddenError("Tenant context is required", {
        errorCode: "IAM_TENANT_CONTEXT_REQUIRED",
      })
    );
  }

  if (!resolveScope) {
    const hasPermission = Boolean(
      req.user?.permissions?.some((permission) => permission.code === permissionCode)
    );

    if (!hasPermission) {
      return next(new ForbiddenError("Permission denied", { errorCode: "IAM_PERMISSION_DENIED" }));
    }

    return next();
  }

  Promise.resolve(resolveScope(req))
    .then(async (result) => {
      if (Array.isArray(result) && result.length === 0) {
        return next(
          new ForbiddenError("Scope access denied", { errorCode: "IAM_SCOPE_ACCESS_DENIED" })
        );
      }

      const targets = Array.isArray(result) ? result : [result];

      for (const target of targets) {
        const decision = await authorizeAccess({
          userId: req.user.id,
          activeTenantId: req.user.activeTenantId,
          requiredPermission: permissionCode,
          requestedScopeType: target?.scopeType,
          requestedTenantId: target?.tenantId,
          requestedBranchId: target?.branchId,
          requestedCampusId: target?.campusId,
          requestedLocationId: target?.locationId,
        });

        if (!decision.allow) {
          return next(
            new ForbiddenError(decision.reason || "Permission denied", { errorCode: decision.code })
          );
        }
      }

      return next();
    })
    .catch(next);
};

module.exports = { requirePermission };
