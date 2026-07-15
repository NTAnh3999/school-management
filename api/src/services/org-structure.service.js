const { BadRequestError, ConflictError, NotFoundError } = require("../utils/error-responses");
const { Branch, Campus, IamAuditLog, Location, Tenant } = require("../models");

const toPlain = (instance) =>
  instance && typeof instance.get === "function" ? instance.get({ plain: true }) : instance;

const recordAuditLog = async ({ actorUserId, tenantId, action, entityType, entityId, details }) => {
  return IamAuditLog.create({
    actor_user_id: actorUserId,
    tenant_id: tenantId,
    action,
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    status: "success",
    details,
  });
};

const formatBranch = (instance) => {
  if (!instance) return null;
  const branch = toPlain(instance);
  return {
    id: branch.id,
    tenantId: branch.tenant_id,
    branchCode: branch.branch_code,
    branchName: branch.branch_name,
    status: branch.status,
  };
};

const formatCampus = (instance) => {
  if (!instance) return null;
  const campus = toPlain(instance);
  return {
    id: campus.id,
    tenantId: campus.tenant_id,
    branchId: campus.branch_id,
    campusCode: campus.campus_code,
    campusName: campus.campus_name,
    status: campus.status,
  };
};

const formatLocation = (instance) => {
  if (!instance) return null;
  const location = toPlain(instance);
  return {
    id: location.id,
    tenantId: location.tenant_id,
    branchId: location.branch_id,
    campusId: location.campus_id,
    parentLocationId: location.parent_location_id,
    locationCode: location.location_code,
    locationName: location.location_name,
    locationType: location.location_type,
    capacity: location.capacity,
    status: location.status,
    metadata: location.metadata,
  };
};

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

const listBranches = async ({ tenantId } = {}) => {
  const where = tenantId ? { tenant_id: tenantId } : {};
  const branches = await Branch.findAll({ where, order: [["id", "ASC"]] });
  return branches.map(formatBranch);
};

const createBranch = async ({ tenantId, branchCode, branchName, status }, actor, req) => {
  void req;
  if (!tenantId || !branchCode || !branchName) {
    throw new BadRequestError("tenantId, branchCode and branchName are required");
  }
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new NotFoundError("Tenant not found");

  const existing = await Branch.findOne({
    where: { tenant_id: tenant.id, branch_code: branchCode },
  });
  if (existing) throw new ConflictError("Branch code already exists for this tenant");

  const branch = await Branch.create({
    tenant_id: tenant.id,
    branch_code: branchCode,
    branch_name: branchName,
    status,
  });

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: tenant.id,
    action: "org.branch.create",
    entityType: "branch",
    entityId: branch.id,
    details: { branchCode, branchName },
  });

  return formatBranch(branch);
};

const updateBranch = async (branchId, payload, actor, req) => {
  void req;
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new NotFoundError("Branch not found");

  if (payload.branchName) branch.branch_name = payload.branchName;
  if (payload.status) branch.status = payload.status;
  await branch.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: branch.tenant_id,
    action: "org.branch.update",
    entityType: "branch",
    entityId: branch.id,
    details: payload,
  });

  return formatBranch(branch);
};

// ---------------------------------------------------------------------------
// Campuses
// ---------------------------------------------------------------------------

const listCampuses = async ({ branchId, tenantId } = {}) => {
  const where = {};
  if (branchId) where.branch_id = branchId;
  if (tenantId) where.tenant_id = tenantId;
  const campuses = await Campus.findAll({ where, order: [["id", "ASC"]] });
  return campuses.map(formatCampus);
};

const createCampus = async ({ branchId, campusCode, campusName, status }, actor, req) => {
  void req;
  if (!branchId || !campusCode || !campusName) {
    throw new BadRequestError("branchId, campusCode and campusName are required");
  }
  const branch = await Branch.findByPk(branchId);
  if (!branch) throw new NotFoundError("Branch not found");

  const existing = await Campus.findOne({
    where: { branch_id: branch.id, campus_code: campusCode },
  });
  if (existing) throw new ConflictError("Campus code already exists for this branch");

  // tenant_id/branch_id are always derived from the parent branch, never trusted from the client,
  // so the org-structure hierarchy can't drift even though these columns are denormalized.
  const campus = await Campus.create({
    tenant_id: branch.tenant_id,
    branch_id: branch.id,
    campus_code: campusCode,
    campus_name: campusName,
    status,
  });

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: branch.tenant_id,
    action: "org.campus.create",
    entityType: "campus",
    entityId: campus.id,
    details: { branchId: branch.id, campusCode, campusName },
  });

  return formatCampus(campus);
};

const updateCampus = async (campusId, payload, actor, req) => {
  void req;
  const campus = await Campus.findByPk(campusId);
  if (!campus) throw new NotFoundError("Campus not found");

  if (payload.campusName) campus.campus_name = payload.campusName;
  if (payload.status) campus.status = payload.status;
  await campus.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: campus.tenant_id,
    action: "org.campus.update",
    entityType: "campus",
    entityId: campus.id,
    details: payload,
  });

  return formatCampus(campus);
};

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

const listLocations = async ({ campusId, branchId, tenantId } = {}) => {
  const where = {};
  if (campusId) where.campus_id = campusId;
  if (branchId) where.branch_id = branchId;
  if (tenantId) where.tenant_id = tenantId;
  const locations = await Location.findAll({ where, order: [["id", "ASC"]] });
  return locations.map(formatLocation);
};

const createLocation = async (
  {
    campusId,
    parentLocationId,
    locationCode,
    locationName,
    locationType,
    capacity,
    status,
    metadata,
  },
  actor,
  req
) => {
  void req;
  if (!campusId || !locationCode || !locationName) {
    throw new BadRequestError("campusId, locationCode and locationName are required");
  }
  const campus = await Campus.findByPk(campusId);
  if (!campus) throw new NotFoundError("Campus not found");

  if (parentLocationId) {
    const parent = await Location.findByPk(parentLocationId);
    if (!parent) throw new NotFoundError("Parent location not found");
    if (Number(parent.campus_id) !== Number(campus.id)) {
      throw new BadRequestError("parentLocationId must belong to the same campus");
    }
  }

  const existing = await Location.findOne({
    where: { campus_id: campus.id, location_code: locationCode },
  });
  if (existing) throw new ConflictError("Location code already exists for this campus");

  // tenant_id/branch_id/campus_id are always derived from the parent campus, never trusted
  // from the client, so the org-structure hierarchy can't drift.
  const location = await Location.create({
    tenant_id: campus.tenant_id,
    branch_id: campus.branch_id,
    campus_id: campus.id,
    parent_location_id: parentLocationId || null,
    location_code: locationCode,
    location_name: locationName,
    location_type: locationType,
    capacity: capacity || null,
    status,
    metadata: metadata || null,
  });

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: campus.tenant_id,
    action: "org.location.create",
    entityType: "location",
    entityId: location.id,
    details: { campusId: campus.id, locationCode, locationName },
  });

  return formatLocation(location);
};

const updateLocation = async (locationId, payload, actor, req) => {
  void req;
  const location = await Location.findByPk(locationId);
  if (!location) throw new NotFoundError("Location not found");

  if (payload.locationName) location.location_name = payload.locationName;
  if (payload.locationType) location.location_type = payload.locationType;
  if (typeof payload.capacity !== "undefined") location.capacity = payload.capacity;
  if (payload.status) location.status = payload.status;
  if (typeof payload.metadata !== "undefined") location.metadata = payload.metadata;
  await location.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: location.tenant_id,
    action: "org.location.update",
    entityType: "location",
    entityId: location.id,
    details: payload,
  });

  return formatLocation(location);
};

module.exports = {
  listBranches,
  createBranch,
  updateBranch,
  listCampuses,
  createCampus,
  updateCampus,
  listLocations,
  createLocation,
  updateLocation,
};
