const { OKResponse, CreatedResponse } = require("../utils/success-responses");
const ProfileService = require("../services/profile.service");
const asyncHandler = require("../utils/async-handler");

// PROFILE-00: List profiles
const listProfiles = asyncHandler(async (req, res) => {
  const { profileType, status, search, page, limit } = req.query;
  // Resolve tenantId – use default for single-tenant deployments
  const tenantId = req.user?.tenantId || 1;
  const result = await ProfileService.listProfiles(
    { tenantId, profileType, status, search, page, limit },
    req.user
  );
  return new OKResponse({ metadata: result }).send(res);
});

// PROFILE-00: Get profile by ID
const getProfileById = asyncHandler(async (req, res) => {
  const profile = await ProfileService.getProfileById(req.params.id, req.user);
  return new OKResponse({ metadata: { profile } }).send(res);
});

// PROFILE-10: Get profile summary
const getProfileSummary = asyncHandler(async (req, res) => {
  const summary = await ProfileService.getProfileSummary(req.params.id);
  return new OKResponse({ metadata: { summary } }).send(res);
});

// PROFILE-01: Create profile
const createProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileService.createProfile(req.body, req.user);
  return new CreatedResponse({ message: "Profile created", metadata: { profile } }).send(res);
});

// PROFILE-02: Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await ProfileService.updateProfile(req.params.id, req.body, req.user);
  return new OKResponse({ message: "Profile updated", metadata: { profile } }).send(res);
});

// PROFILE-03: Change profile status
const changeProfileStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const profile = await ProfileService.changeProfileStatus(req.params.id, status, reason, req.user);
  return new OKResponse({ message: "Profile status updated", metadata: { profile } }).send(res);
});

// PROFILE-07: Link parent to student
const linkParentToStudent = asyncHandler(async (req, res) => {
  const { parentProfileId, studentProfileId, relationshipType } = req.body;
  const relationship = await ProfileService.linkParentToStudent(
    { parentProfileId, studentProfileId, relationshipType },
    req.user
  );
  return new CreatedResponse({
    message: "Parent linked to student",
    metadata: { relationship },
  }).send(res);
});

// PROFILE-08: Unlink parent-student relationship
const unlinkParentStudent = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const relationship = await ProfileService.unlinkParentStudent(
    req.params.relationshipId,
    reason,
    req.user
  );
  return new OKResponse({ message: "Relationship revoked", metadata: { relationship } }).send(res);
});

// PROFILE-09: Get linked students for a parent profile
const getLinkedStudents = asyncHandler(async (req, res) => {
  const students = await ProfileService.getLinkedStudents(req.params.parentProfileId, req.user);
  return new OKResponse({ metadata: { students } }).send(res);
});

// PROFILE-13: View audit logs for a profile
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await ProfileService.getAuditLogs(req.params.id);
  return new OKResponse({ metadata: { logs } }).send(res);
});

module.exports = {
  listProfiles,
  getProfileById,
  getProfileSummary,
  createProfile,
  updateProfile,
  changeProfileStatus,
  linkParentToStudent,
  unlinkParentStudent,
  getLinkedStudents,
  getAuditLogs,
};
