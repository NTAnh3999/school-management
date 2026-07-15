const { CreatedResponse, OKResponse } = require("../utils/success-responses");
const asyncHandler = require("../utils/async-handler");
const OrgStructureService = require("../services/org-structure.service");

const listBranches = asyncHandler(async (req, res) => {
  const branches = await OrgStructureService.listBranches({
    tenantId: req.query?.tenantId ? Number(req.query.tenantId) : undefined,
  });
  return new OKResponse({ message: "Branches", metadata: { branches } }).send(res);
});

const createBranch = asyncHandler(async (req, res) => {
  const branch = await OrgStructureService.createBranch(req.body || {}, req.user, req);
  return new CreatedResponse({ message: "Branch created", metadata: { branch } }).send(res);
});

const updateBranch = asyncHandler(async (req, res) => {
  const branch = await OrgStructureService.updateBranch(
    Number(req.params.id),
    req.body || {},
    req.user,
    req
  );
  return new OKResponse({ message: "Branch updated", metadata: { branch } }).send(res);
});

const listCampuses = asyncHandler(async (req, res) => {
  const campuses = await OrgStructureService.listCampuses({
    branchId: req.query?.branchId ? Number(req.query.branchId) : undefined,
    tenantId: req.query?.tenantId ? Number(req.query.tenantId) : undefined,
  });
  return new OKResponse({ message: "Campuses", metadata: { campuses } }).send(res);
});

const createCampus = asyncHandler(async (req, res) => {
  const campus = await OrgStructureService.createCampus(req.body || {}, req.user, req);
  return new CreatedResponse({ message: "Campus created", metadata: { campus } }).send(res);
});

const updateCampus = asyncHandler(async (req, res) => {
  const campus = await OrgStructureService.updateCampus(
    Number(req.params.id),
    req.body || {},
    req.user,
    req
  );
  return new OKResponse({ message: "Campus updated", metadata: { campus } }).send(res);
});

const listLocations = asyncHandler(async (req, res) => {
  const locations = await OrgStructureService.listLocations({
    campusId: req.query?.campusId ? Number(req.query.campusId) : undefined,
    branchId: req.query?.branchId ? Number(req.query.branchId) : undefined,
    tenantId: req.query?.tenantId ? Number(req.query.tenantId) : undefined,
  });
  return new OKResponse({ message: "Locations", metadata: { locations } }).send(res);
});

const createLocation = asyncHandler(async (req, res) => {
  const location = await OrgStructureService.createLocation(req.body || {}, req.user, req);
  return new CreatedResponse({ message: "Location created", metadata: { location } }).send(res);
});

const updateLocation = asyncHandler(async (req, res) => {
  const location = await OrgStructureService.updateLocation(
    Number(req.params.id),
    req.body || {},
    req.user,
    req
  );
  return new OKResponse({ message: "Location updated", metadata: { location } }).send(res);
});

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
