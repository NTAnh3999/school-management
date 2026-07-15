const { Branch, Campus, Location } = require("../models");
const { SCOPE_TYPES } = require("../constants/iam");

const MAX_LOCATION_ANCESTRY_DEPTH = 20;

/**
 * Walks parent_location_id upward from `locationId`, returning [locationId, parent, grandparent, ...].
 * Depth-capped to guard against a corrupted cycle in the data.
 */
const resolveLocationAncestry = async (locationId) => {
  const ancestry = [];
  let currentId = locationId;
  let depth = 0;

  while (currentId && depth < MAX_LOCATION_ANCESTRY_DEPTH) {
    ancestry.push(Number(currentId));
    const location = await Location.findByPk(currentId, {
      attributes: ["id", "parent_location_id"],
    });
    if (!location) break;
    currentId = location.parent_location_id;
    depth += 1;
  }

  return ancestry;
};

/**
 * Resolves the full {tenantId, branchId, campusId, locationId} scope shape for a
 * given org-structure entity, so callers can build a `targetScope` for scopeCovers()
 * from just a business record's foreign key (e.g. a classroom's campus_id).
 */
const resolveScopeOfEntity = async ({ type, id }) => {
  if (!type || !id) return null;

  switch (type) {
    case SCOPE_TYPES.BRANCH: {
      const branch = await Branch.findByPk(id);
      if (!branch) return null;
      return { tenantId: branch.tenant_id, branchId: branch.id, campusId: null, locationId: null };
    }
    case SCOPE_TYPES.CAMPUS: {
      const campus = await Campus.findByPk(id);
      if (!campus) return null;
      return {
        tenantId: campus.tenant_id,
        branchId: campus.branch_id,
        campusId: campus.id,
        locationId: null,
      };
    }
    case SCOPE_TYPES.LOCATION: {
      const location = await Location.findByPk(id);
      if (!location) return null;
      return {
        tenantId: location.tenant_id,
        branchId: location.branch_id,
        campusId: location.campus_id,
        locationId: location.id,
      };
    }
    default:
      return null;
  }
};

/**
 * Does `assignmentScope` (a membership's or role assignment's scope) cover `targetScope`
 * (the scope of the resource being accessed)? Tenant scope covers everything in the
 * tenant; branch/campus scope cover flatly via the denormalized branch_id/campus_id
 * columns; location scope additionally covers any descendant location via
 * parent_location_id ancestry.
 */
const scopeCovers = async (assignmentScope, targetScope) => {
  if (!assignmentScope || !targetScope) return false;
  if (Number(assignmentScope.tenantId) !== Number(targetScope.tenantId)) return false;

  switch (assignmentScope.scopeType) {
    case SCOPE_TYPES.TENANT:
      return true;

    case SCOPE_TYPES.BRANCH:
      return (
        targetScope.branchId != null &&
        Number(assignmentScope.branchId) === Number(targetScope.branchId)
      );

    case SCOPE_TYPES.CAMPUS:
      return (
        targetScope.campusId != null &&
        Number(assignmentScope.campusId) === Number(targetScope.campusId)
      );

    case SCOPE_TYPES.LOCATION: {
      if (targetScope.locationId == null) return false;
      if (Number(assignmentScope.locationId) === Number(targetScope.locationId)) return true;
      const ancestry = await resolveLocationAncestry(targetScope.locationId);
      return ancestry.includes(Number(assignmentScope.locationId));
    }

    default:
      return false;
  }
};

module.exports = {
  resolveLocationAncestry,
  resolveScopeOfEntity,
  scopeCovers,
};
