const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ProfileService = require("../services/profile.service");
const asyncHandler = require("../utils/async-handler");

const resolveTenantId = (req) =>
  req.query.tenantId ||
  req.body?.tenantId ||
  req.user?.activeTenantId ||
  req.user?.active_tenant_id ||
  req.user?.tenantId ||
  req.user?.tenant_id ||
  null;

const listProfiles = asyncHandler(async (req, res) => {
  const { profileType, status, search, page, limit } = req.query;
  const result = await ProfileService.listProfiles(
    { tenantId: resolveTenantId(req), profileType, status, search, page, limit },
    req.user
  );
  return new OKResponse({ metadata: result }).send(res);
});

const getProfileById = asyncHandler(async (req, res) => {
  const profile = await ProfileService.getProfileById(req.params.id, req.user);
  return new OKResponse({ metadata: { profile } }).send(res);
});

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileService.getMyProfile(req.user, req.query.profileType);
  return new OKResponse({ metadata: { profile } }).send(res);
});

const getProfileSummary = asyncHandler(async (req, res) => {
  const summary = await ProfileService.getProfileSummary(req.params.id, req.user);
  return new OKResponse({ metadata: { summary } }).send(res);
});

const getMyProfileSummary = asyncHandler(async (req, res) => {
  const summary = await ProfileService.getMyProfileSummary(req.user, req.query.profileType);
  return new OKResponse({ metadata: { summary } }).send(res);
});

const createProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileService.createProfile(req.body, req.user);
  return new CreatedResponse({ message: "Profile created", metadata: { profile } }).send(res);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileService.updateProfile(req.params.id, req.body, req.user);
  return new OKResponse({ message: "Profile updated", metadata: { profile } }).send(res);
});

const changeProfileStatus = asyncHandler(async (req, res) => {
  const profile = await ProfileService.changeProfileStatus(
    req.params.id,
    req.body.status,
    req.body.reason,
    req.user
  );
  return new OKResponse({ message: "Profile status updated", metadata: { profile } }).send(res);
});

const linkParentToStudent = asyncHandler(async (req, res) => {
  const relationship = await ProfileService.linkParentToStudent(
    {
      parentProfileId: req.body.parentProfileId,
      studentProfileId: req.body.studentProfileId,
      relationshipType: req.body.relationshipType,
      relationshipStatus: req.body.relationshipStatus,
    },
    req.user
  );
  return new CreatedResponse({
    message: "Parent linked to student",
    metadata: { relationship },
  }).send(res);
});

const updateRelationshipStatus = asyncHandler(async (req, res) => {
  const relationship = await ProfileService.updateRelationshipStatus(
    req.params.relationshipId,
    req.body.status,
    req.body.reason,
    req.user
  );
  return new OKResponse({
    message: "Relationship status updated",
    metadata: { relationship },
  }).send(res);
});

const unlinkParentStudent = asyncHandler(async (req, res) => {
  const relationship = await ProfileService.unlinkParentStudent(
    req.params.relationshipId,
    req.body.reason,
    req.user
  );
  return new OKResponse({ message: "Relationship revoked", metadata: { relationship } }).send(res);
});

const getLinkedStudents = asyncHandler(async (req, res) => {
  const students = await ProfileService.getLinkedStudents(req.params.parentProfileId, req.user);
  return new OKResponse({ metadata: { students } }).send(res);
});

const getMyLinkedStudents = asyncHandler(async (req, res) => {
  const students = await ProfileService.getMyLinkedStudents(req.user);
  return new OKResponse({ metadata: { students } }).send(res);
});

const exportProfiles = asyncHandler(async (req, res) => {
  const exportData = await ProfileService.exportProfiles(
    {
      tenantId: resolveTenantId(req),
      profileType: req.query.profileType,
      status: req.query.status,
      search: req.query.search,
    },
    req.user
  );
  return new OKResponse({ metadata: exportData }).send(res);
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await ProfileService.getAuditLogs(req.params.id, req.user);
  return new OKResponse({ metadata: { logs } }).send(res);
});

module.exports = {
  changeProfileStatus,
  createProfile,
  exportProfiles,
  getAuditLogs,
  getLinkedStudents,
  getMyLinkedStudents,
  getMyProfile,
  getMyProfileSummary,
  getProfileById,
  getProfileSummary,
  linkParentToStudent,
  listProfiles,
  unlinkParentStudent,
  updateProfile,
  updateRelationshipStatus,
};
