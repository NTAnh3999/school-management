"use strict";
const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/error-responses");
const {
  Profile,
  StudentProfile,
  ParentProfile,
  TeacherProfile,
  ParentStudentRelationship,
  Tenant,
  User,
  AuditLog,
} = require("../models");
const { ROLES, isRole } = require("../constants/roles");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROFILE_TYPES = Object.freeze({
  STUDENT: "student",
  PARENT: "parent",
  TEACHER: "teacher",
  STAFF: "staff",
  ADMIN: "admin",
});

const PROFILE_STATUSES = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
});

const RELATIONSHIP_STATUSES = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REVOKED: "revoked",
});

// Valid profile status transitions per FSD §8.4
const PROFILE_STATUS_TRANSITIONS = Object.freeze({
  draft: ["active"],
  active: ["inactive"],
  inactive: ["active", "archived"],
  archived: [],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getDefaultTenant = async () => {
  const tenant = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (!tenant) throw new BadRequestError("Default tenant not configured");
  return tenant;
};

const resolveExtensionIncludes = (profileType) => {
  const includes = [];
  if (!profileType || profileType === PROFILE_TYPES.STUDENT) {
    includes.push({ model: StudentProfile, as: "student_profile", required: false });
  }
  if (!profileType || profileType === PROFILE_TYPES.PARENT) {
    includes.push({ model: ParentProfile, as: "parent_profile", required: false });
  }
  if (!profileType || profileType === PROFILE_TYPES.TEACHER) {
    includes.push({ model: TeacherProfile, as: "teacher_profile", required: false });
  }
  return includes;
};

const writeAuditLog = async ({
  tenantId,
  entityType,
  entityId,
  action,
  actorId,
  oldValues,
  newValues,
  reason,
}) => {
  try {
    await AuditLog.create({
      entity_name: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      changed_by: actorId || null,
      changed_at: new Date(),
      source: reason || null,
    });
  } catch {
    // Audit failures must not block main operations
  }
};

// ---------------------------------------------------------------------------
// PROFILE-00: List / Get Profiles
// ---------------------------------------------------------------------------

const listProfiles = async (
  { tenantId, profileType, status, search, page = 1, limit = 20 } = {},
  actorUser
) => {
  const where = { tenant_id: tenantId };
  if (profileType) where.profile_type = profileType;
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { display_name: { [Op.like]: `%${search}%` } },
      { contact_email: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await Profile.findAndCountAll({
    where,
    include: resolveExtensionIncludes(profileType),
    limit: parseInt(limit, 10),
    offset,
    order: [["created_at", "DESC"]],
  });

  return { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), profiles: rows };
};

const getProfileById = async (profileId, actorUser) => {
  const profile = await Profile.findByPk(profileId, {
    include: [
      { model: StudentProfile, as: "student_profile", required: false },
      { model: ParentProfile, as: "parent_profile", required: false },
      { model: TeacherProfile, as: "teacher_profile", required: false },
    ],
  });
  if (!profile) throw new NotFoundError("Profile not found");
  return profile;
};

// PROFILE-10: Profile Summary (lightweight projection for portals / downstream)
const getProfileSummary = async (profileId) => {
  const profile = await Profile.findByPk(profileId, {
    attributes: [
      "id",
      "user_id",
      "tenant_id",
      "profile_type",
      "full_name",
      "display_name",
      "avatar_url",
      "status",
    ],
    include: [
      {
        model: StudentProfile,
        as: "student_profile",
        attributes: ["student_code"],
        required: false,
      },
      {
        model: TeacherProfile,
        as: "teacher_profile",
        attributes: ["teacher_code"],
        required: false,
      },
    ],
  });
  if (!profile) throw new NotFoundError("Profile not found");
  return profile;
};

// ---------------------------------------------------------------------------
// PROFILE-01: Create Profile
// ---------------------------------------------------------------------------

const createProfile = async (data, actorUser) => {
  const {
    userId,
    profileType,
    fullName,
    displayName,
    avatarUrl,
    contactEmail,
    phoneNumber,
    address,
    status = PROFILE_STATUSES.DRAFT,
    visibility = "internal",
    // Student extension
    studentCode,
    dateOfBirth,
    gender,
    currentLevel,
    learningGoal,
    // Parent extension
    parentCode,
    occupation,
    contactPriority,
    emergencyContactFlag,
    // Teacher extension
    teacherCode,
    bio,
    expertise,
    qualification,
    yearsOfExperience,
    publicProfileEnabled,
  } = data;

  if (!userId) throw new BadRequestError("userId is required");
  if (!profileType) throw new BadRequestError("profileType is required");
  if (!Object.values(PROFILE_TYPES).includes(profileType))
    throw new BadRequestError(`Invalid profileType: ${profileType}`);
  if (!fullName || fullName.trim().length < 2)
    throw new BadRequestError("fullName must be at least 2 characters");

  // Verify user identity exists
  const userRecord = await User.findByPk(userId);
  if (!userRecord) throw new NotFoundError("User identity not found");

  // Resolve tenant – use default tenant for now
  const tenant = await getDefaultTenant();

  const profile = await Profile.create({
    tenant_id: tenant.id,
    user_id: userId,
    profile_type: profileType,
    full_name: fullName.trim(),
    display_name: displayName || null,
    avatar_url: avatarUrl || null,
    contact_email: contactEmail || null,
    phone_number: phoneNumber || null,
    address: address || null,
    status,
    visibility,
    created_by: actorUser.id,
    updated_by: actorUser.id,
  });

  // Create type-specific extension
  if (profileType === PROFILE_TYPES.STUDENT) {
    await StudentProfile.create({
      profile_id: profile.id,
      student_code: studentCode || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      current_level: currentLevel || null,
      learning_goal: learningGoal || null,
      student_status: status === PROFILE_STATUSES.ACTIVE ? "active" : null,
    });
  } else if (profileType === PROFILE_TYPES.PARENT) {
    await ParentProfile.create({
      profile_id: profile.id,
      parent_code: parentCode || null,
      occupation: occupation || null,
      contact_priority: contactPriority ?? 1,
      emergency_contact_flag: emergencyContactFlag ?? false,
    });
  } else if (profileType === PROFILE_TYPES.TEACHER) {
    await TeacherProfile.create({
      profile_id: profile.id,
      teacher_code: teacherCode || null,
      bio: bio || null,
      expertise: expertise || null,
      qualification: qualification || null,
      years_of_experience: yearsOfExperience ?? 0,
      public_profile_enabled: publicProfileEnabled ?? false,
    });
  }

  await writeAuditLog({
    entityType: "Profile",
    entityId: profile.id,
    action: "CREATE",
    actorId: actorUser.id,
    newValues: { profile_type: profileType, full_name: profile.full_name, status },
  });

  return getProfileById(profile.id, actorUser);
};

// ---------------------------------------------------------------------------
// PROFILE-02: Update Profile
// ---------------------------------------------------------------------------

// Fields that only Admin can change
const ADMIN_ONLY_FIELDS = ["status", "profile_type", "user_id", "tenant_id"];
// Fields that owners (student/parent/teacher) can update on their own profile
const OWNER_EDITABLE_FIELDS = [
  "display_name",
  "avatar_url",
  "phone_number",
  "address",
  "contact_email",
];
// Extension-specific owner-editable fields
const OWNER_EDITABLE_EXTENSION = {
  student: ["learning_goal", "current_level"],
  parent: ["occupation", "contact_priority", "emergency_contact_flag"],
  teacher: ["bio", "expertise", "qualification", "years_of_experience"],
};

const updateProfile = async (profileId, data, actorUser) => {
  const profile = await Profile.findByPk(profileId, {
    include: resolveExtensionIncludes(null),
  });
  if (!profile) throw new NotFoundError("Profile not found");

  const isAdmin = isRole(actorUser.role, ROLES.ADMIN);
  const isOwner = profile.user_id === actorUser.id;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError("Insufficient permissions to update this profile");
  }

  // Determine allowed fields
  let allowedBaseFields = isAdmin
    ? [
        "full_name",
        "display_name",
        "avatar_url",
        "contact_email",
        "phone_number",
        "address",
        "visibility",
      ]
    : OWNER_EDITABLE_FIELDS;

  const oldValues = profile.toJSON();
  const updates = {};

  for (const field of allowedBaseFields) {
    const camelKey = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (data[camelKey] !== undefined) updates[field] = data[camelKey];
    if (data[field] !== undefined) updates[field] = data[field];
  }

  if (Object.keys(updates).length > 0) {
    Object.assign(profile, updates);
    profile.updated_by = actorUser.id;
    await profile.save();
  }

  // Handle extension updates
  const extFields = isAdmin
    ? [
        ...(OWNER_EDITABLE_EXTENSION[profile.profile_type] || []),
        "student_code",
        "date_of_birth",
        "gender",
        "current_level",
        "learning_goal",
        "student_status",
        "parent_code",
        "occupation",
        "contact_priority",
        "emergency_contact_flag",
        "teacher_code",
        "bio",
        "expertise",
        "qualification",
        "years_of_experience",
        "public_profile_enabled",
      ]
    : OWNER_EDITABLE_EXTENSION[profile.profile_type] || [];

  const extUpdates = {};
  for (const field of extFields) {
    const camelKey = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (data[camelKey] !== undefined) extUpdates[field] = data[camelKey];
    if (data[field] !== undefined) extUpdates[field] = data[field];
  }

  if (Object.keys(extUpdates).length > 0) {
    if (profile.profile_type === PROFILE_TYPES.STUDENT && profile.student_profile) {
      await profile.student_profile.update(extUpdates);
    } else if (profile.profile_type === PROFILE_TYPES.PARENT && profile.parent_profile) {
      await profile.parent_profile.update(extUpdates);
    } else if (profile.profile_type === PROFILE_TYPES.TEACHER && profile.teacher_profile) {
      await profile.teacher_profile.update(extUpdates);
    }
  }

  await writeAuditLog({
    entityType: "Profile",
    entityId: profileId,
    action: "UPDATE",
    actorId: actorUser.id,
    oldValues: { full_name: oldValues.full_name, status: oldValues.status },
    newValues: updates,
  });

  return getProfileById(profileId, actorUser);
};

// ---------------------------------------------------------------------------
// PROFILE-03: Change Profile Status
// ---------------------------------------------------------------------------

const changeProfileStatus = async (profileId, newStatus, reason, actorUser) => {
  const profile = await Profile.findByPk(profileId);
  if (!profile) throw new NotFoundError("Profile not found");

  const allowed = PROFILE_STATUS_TRANSITIONS[profile.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition profile status from '${profile.status}' to '${newStatus}'`
    );
  }

  const oldStatus = profile.status;
  profile.status = newStatus;
  profile.updated_by = actorUser.id;
  await profile.save();

  await writeAuditLog({
    entityType: "Profile",
    entityId: profileId,
    action: "CHANGE_STATUS",
    actorId: actorUser.id,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    reason,
  });

  return profile;
};

// ---------------------------------------------------------------------------
// PROFILE-07: Link Parent to Student
// ---------------------------------------------------------------------------

const linkParentToStudent = async (
  { parentProfileId, studentProfileId, relationshipType = "guardian" },
  actorUser
) => {
  const parentProfile = await ParentProfile.findByPk(parentProfileId, {
    include: [{ model: Profile, as: "profile" }],
  });
  if (!parentProfile) throw new NotFoundError("Parent profile not found");

  const studentProfile = await StudentProfile.findByPk(studentProfileId, {
    include: [{ model: Profile, as: "profile" }],
  });
  if (!studentProfile) throw new NotFoundError("Student profile not found");

  // Tenant isolation check
  if (parentProfile.profile.tenant_id !== studentProfile.profile.tenant_id) {
    throw new BadRequestError("Parent and Student must belong to the same tenant");
  }

  // Prevent duplicate active/pending relationship
  const existing = await ParentStudentRelationship.findOne({
    where: {
      parent_profile_id: parentProfileId,
      student_profile_id: studentProfileId,
      status: { [Op.in]: [RELATIONSHIP_STATUSES.ACTIVE, RELATIONSHIP_STATUSES.PENDING] },
    },
  });
  if (existing) {
    throw new ConflictError(
      `An active or pending relationship already exists between this parent and student`
    );
  }

  const relationship = await ParentStudentRelationship.create({
    tenant_id: parentProfile.profile.tenant_id,
    parent_profile_id: parentProfileId,
    student_profile_id: studentProfileId,
    relationship_type: relationshipType,
    status: RELATIONSHIP_STATUSES.ACTIVE,
    start_date: new Date(),
    created_by: actorUser.id,
    updated_by: actorUser.id,
  });

  await writeAuditLog({
    entityType: "ParentStudentRelationship",
    entityId: relationship.id,
    action: "LINK",
    actorId: actorUser.id,
    newValues: {
      parent_profile_id: parentProfileId,
      student_profile_id: studentProfileId,
      relationship_type: relationshipType,
    },
  });

  return relationship;
};

// ---------------------------------------------------------------------------
// PROFILE-08: Unlink / Deactivate Parent-Student Relationship
// ---------------------------------------------------------------------------

const unlinkParentStudent = async (relationshipId, reason, actorUser) => {
  const relationship = await ParentStudentRelationship.findByPk(relationshipId);
  if (!relationship) throw new NotFoundError("Relationship not found");

  if (relationship.status === RELATIONSHIP_STATUSES.REVOKED) {
    throw new BadRequestError("Relationship is already revoked");
  }

  const oldStatus = relationship.status;
  relationship.status = RELATIONSHIP_STATUSES.REVOKED;
  relationship.end_date = new Date();
  relationship.reason = reason || null;
  relationship.updated_by = actorUser.id;
  await relationship.save();

  await writeAuditLog({
    entityType: "ParentStudentRelationship",
    entityId: relationshipId,
    action: "UNLINK",
    actorId: actorUser.id,
    oldValues: { status: oldStatus },
    newValues: { status: RELATIONSHIP_STATUSES.REVOKED },
    reason,
  });

  return relationship;
};

// ---------------------------------------------------------------------------
// PROFILE-09: View Linked Students (for a Parent)
// ---------------------------------------------------------------------------

const getLinkedStudents = async (parentProfileId, actorUser) => {
  const relationships = await ParentStudentRelationship.findAll({
    where: {
      parent_profile_id: parentProfileId,
      status: RELATIONSHIP_STATUSES.ACTIVE,
    },
    include: [
      {
        model: StudentProfile,
        as: "student_profile",
        include: [
          {
            model: Profile,
            as: "profile",
            attributes: [
              "id",
              "user_id",
              "full_name",
              "display_name",
              "avatar_url",
              "status",
              "tenant_id",
            ],
          },
        ],
      },
    ],
  });

  return relationships.map((r) => ({
    relationship_id: r.id,
    relationship_type: r.relationship_type,
    status: r.status,
    student_profile_id: r.student_profile_id,
    student: r.student_profile?.profile || null,
    student_code: r.student_profile?.student_code || null,
  }));
};

// ---------------------------------------------------------------------------
// PROFILE-13: View Audit Log for a profile entity
// ---------------------------------------------------------------------------

const getAuditLogs = async (profileId) => {
  const profile = await Profile.findByPk(profileId);
  if (!profile) throw new NotFoundError("Profile not found");

  return AuditLog.findAll({
    where: { entity_name: "Profile", entity_id: profileId },
    order: [["changed_at", "DESC"]],
  });
};

module.exports = {
  PROFILE_TYPES,
  PROFILE_STATUSES,
  RELATIONSHIP_STATUSES,
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
