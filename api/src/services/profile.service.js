"use strict";

const { Op } = require("sequelize");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require("../utils/error-responses");
const {
  AuditLog,
  ClassroomEnrollment,
  ClassroomTeacher,
  ParentProfile,
  ParentStudentRelationship,
  Profile,
  StudentProfile,
  TeacherProfile,
  Tenant,
  User,
  sequelize,
} = require("../models");
const { ROLES, isRole, normalizeRole } = require("../constants/roles");

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

const PROFILE_STATUS_TRANSITIONS = Object.freeze({
  draft: ["active", "inactive"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
});

const ACTIVE_CLASSROOM_ENROLLMENT_STATUSES = ["enrolled", "completed"];

const PROFILE_EXTENSION_MODELS = Object.freeze({
  [PROFILE_TYPES.STUDENT]: {
    model: StudentProfile,
    as: "student_profile",
    codeField: "student_code",
  },
  [PROFILE_TYPES.PARENT]: {
    model: ParentProfile,
    as: "parent_profile",
    codeField: "parent_code",
  },
  [PROFILE_TYPES.TEACHER]: {
    model: TeacherProfile,
    as: "teacher_profile",
    codeField: "teacher_code",
  },
});

const OWNER_EDITABLE_FIELDS = Object.freeze({
  [PROFILE_TYPES.STUDENT]: ["display_name", "avatar_url", "contact_email", "phone_number", "address"],
  [PROFILE_TYPES.PARENT]: ["display_name", "avatar_url", "contact_email", "phone_number", "address"],
  [PROFILE_TYPES.TEACHER]: ["display_name", "avatar_url", "contact_email", "phone_number", "address"],
});

const OWNER_EDITABLE_EXTENSION_FIELDS = Object.freeze({
  [PROFILE_TYPES.STUDENT]: ["learning_goal"],
  [PROFILE_TYPES.PARENT]: ["occupation"],
  [PROFILE_TYPES.TEACHER]: ["bio", "expertise", "qualification", "years_of_experience"],
});

const ADMIN_EDITABLE_BASE_FIELDS = Object.freeze([
  "full_name",
  "display_name",
  "avatar_url",
  "contact_email",
  "phone_number",
  "address",
  "visibility",
]);

const ADMIN_EDITABLE_EXTENSION_FIELDS = Object.freeze([
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
]);

const FORBIDDEN_PROFILE_FIELDS = Object.freeze([
  "password",
  "passwordHash",
  "password_hash",
  "role",
  "roleId",
  "role_id",
  "permissions",
  "permissionIds",
  "permission_ids",
  "tenantContext",
  "tenant_context",
  "sessionId",
  "session_id",
]);

const resolveActorTenantId = async (actorUser, requestedTenantId = null) => {
  const candidate =
    requestedTenantId ||
    actorUser?.activeTenantId ||
    actorUser?.active_tenant_id ||
    actorUser?.tenantId ||
    actorUser?.tenant_id ||
    null;

  if (candidate) {
    const tenant = await Tenant.findByPk(candidate);
    if (!tenant) throw new NotFoundError("Tenant not found");
    return tenant.id;
  }

  const defaultTenant = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (!defaultTenant) throw new BadRequestError("Default tenant not configured");
  return defaultTenant.id;
};

const resolveExtensionIncludes = () => [
  { model: StudentProfile, as: "student_profile", required: false },
  { model: ParentProfile, as: "parent_profile", required: false },
  { model: TeacherProfile, as: "teacher_profile", required: false },
];

const camelToSnake = (value) => value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

const pickUpdates = (data, allowedFields) => {
  const updates = {};
  allowedFields.forEach((field) => {
    const camelKey = field.includes("_")
      ? field.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      : field;
    const snakeKey = camelToSnake(field);
    if (Object.prototype.hasOwnProperty.call(data, field)) updates[field] = data[field];
    if (Object.prototype.hasOwnProperty.call(data, camelKey)) updates[field] = data[camelKey];
    if (Object.prototype.hasOwnProperty.call(data, snakeKey)) updates[field] = data[snakeKey];
  });
  return updates;
};

const ensureNoForbiddenFields = (data) => {
  const providedForbiddenFields = FORBIDDEN_PROFILE_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(data, field)
  );
  if (providedForbiddenFields.length) {
    throw new BadRequestError(
      `Profile payload contains forbidden fields: ${providedForbiddenFields.join(", ")}`
    );
  }
};

const normalizeExpertise = (expertise) => {
  if (expertise === undefined) return undefined;
  if (expertise === null || expertise === "") return null;
  if (Array.isArray(expertise)) return expertise;
  if (typeof expertise === "string") return [expertise];
  throw new BadRequestError("expertise must be a string or array");
};

const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return;
  const parsed = new Date(dateOfBirth);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestError("dateOfBirth is invalid");
  if (parsed > new Date()) throw new BadRequestError("dateOfBirth cannot be in the future");
};

const validateProfileData = (data, { partial = false } = {}) => {
  if (!partial) {
    if (!data.userId) throw new BadRequestError("userId is required");
    if (!data.profileType) throw new BadRequestError("profileType is required");
    if (!data.fullName || String(data.fullName).trim().length < 2) {
      throw new BadRequestError("fullName must be at least 2 characters");
    }
  }

  const profileType = data.profileType || data.profile_type;
  if (profileType && !Object.values(PROFILE_TYPES).includes(profileType)) {
    throw new BadRequestError(`Invalid profileType: ${profileType}`);
  }

  const status = data.status;
  if (status && !Object.values(PROFILE_STATUSES).includes(status)) {
    throw new BadRequestError(`Invalid status: ${status}`);
  }

  if (data.visibility && !["internal", "public", "private"].includes(data.visibility)) {
    throw new BadRequestError("visibility must be internal, public, or private");
  }

  if (data.relationshipType && !["father", "mother", "guardian", "other"].includes(data.relationshipType)) {
    throw new BadRequestError("relationshipType is invalid");
  }

  if (data.relationshipStatus && !Object.values(RELATIONSHIP_STATUSES).includes(data.relationshipStatus)) {
    throw new BadRequestError("relationshipStatus is invalid");
  }

  validateDateOfBirth(data.dateOfBirth || data.date_of_birth);

  const yearsOfExperience = data.yearsOfExperience ?? data.years_of_experience;
  if (yearsOfExperience !== undefined && Number(yearsOfExperience) < 0) {
    throw new BadRequestError("yearsOfExperience must be greater than or equal to 0");
  }
};

const writeAuditLog = async ({
  entityType,
  entityId,
  action,
  actorId,
  oldValues,
  newValues,
  reason,
  transaction,
}) => {
  try {
    await AuditLog.create(
      {
        entity_name: entityType,
        entity_id: entityId,
        action,
        old_values: oldValues || null,
        new_values: newValues || null,
        changed_by: actorId || null,
        changed_at: new Date(),
        source: reason || null,
      },
      transaction ? { transaction } : undefined
    );
  } catch {
    // Audit failures must not block profile operations.
  }
};

const getProfileByIdInternal = async (profileId) => {
  const profile = await Profile.findByPk(profileId, {
    include: resolveExtensionIncludes(),
  });
  if (!profile) throw new NotFoundError("Profile not found");
  return profile;
};

const findUserProfile = async (userId, tenantId, profileType = null) => {
  const where = { user_id: userId, tenant_id: tenantId };
  if (profileType) where.profile_type = profileType;
  let profile = await Profile.findOne({
    where,
    include: resolveExtensionIncludes(),
    order: [
      ["status", "ASC"],
      ["created_at", "ASC"],
    ],
  });

  if (!profile && profileType) {
    profile = await Profile.findOne({
      where: { user_id: userId, tenant_id: tenantId },
      include: resolveExtensionIncludes(),
      order: [
        ["status", "ASC"],
        ["created_at", "ASC"],
      ],
    });
  }

  return profile;
};

const getTeacherScopedStudentUserIds = async (teacherUserId) => {
  const classroomAssignments = await ClassroomTeacher.findAll({
    where: { user_id: teacherUserId, active_flag: true },
    attributes: ["classroom_id"],
  });
  const classroomIds = classroomAssignments.map((assignment) => assignment.classroom_id);
  if (!classroomIds.length) return [];

  const enrollments = await ClassroomEnrollment.findAll({
    where: {
      classroom_id: { [Op.in]: classroomIds },
      enrollment_status: { [Op.in]: ACTIVE_CLASSROOM_ENROLLMENT_STATUSES },
    },
    attributes: ["student_id"],
    group: ["student_id"],
  });
  return enrollments.map((enrollment) => Number(enrollment.student_id));
};

const getParentAccessibleStudentUserIds = async (parentUserId, tenantId) => {
  const relationships = await ParentStudentRelationship.findAll({
    where: { status: RELATIONSHIP_STATUSES.ACTIVE },
    include: [
      {
        model: ParentProfile,
        as: "parent_profile",
        required: true,
        include: [
          {
            model: Profile,
            as: "profile",
            required: true,
            where: { user_id: parentUserId, tenant_id: tenantId, status: { [Op.ne]: PROFILE_STATUSES.ARCHIVED } },
          },
        ],
      },
      {
        model: StudentProfile,
        as: "student_profile",
        required: true,
        include: [
          {
            model: Profile,
            as: "profile",
            required: true,
            where: {
              tenant_id: tenantId,
              status: { [Op.notIn]: [PROFILE_STATUSES.ARCHIVED] },
            },
          },
        ],
      },
    ],
  });

  return relationships
    .map((relationship) => Number(relationship.student_profile?.profile?.user_id))
    .filter(Boolean);
};

const assertProfileAccess = async (profile, actorUser) => {
  const actorRole = normalizeRole(actorUser.role);
  const actorTenantId = await resolveActorTenantId(actorUser);

  if (Number(profile.tenant_id) !== Number(actorTenantId) && !isRole(actorRole, ROLES.ADMIN)) {
    throw new ForbiddenError("Profile is outside the active tenant scope");
  }

  if (isRole(actorRole, ROLES.ADMIN)) return;
  if (Number(profile.user_id) === Number(actorUser.id)) return;

  if (isRole(actorRole, ROLES.PARENT)) {
    if (profile.profile_type !== PROFILE_TYPES.STUDENT) {
      throw new ForbiddenError("Parents can only access linked student profiles");
    }
    const accessibleStudentIds = await getParentAccessibleStudentUserIds(actorUser.id, actorTenantId);
    if (accessibleStudentIds.includes(Number(profile.user_id))) return;
    throw new ForbiddenError("Student profile is outside the parent relationship scope");
  }

  if (isRole(actorRole, ROLES.TEACHER)) {
    if (profile.profile_type !== PROFILE_TYPES.STUDENT) {
      throw new ForbiddenError("Teachers can only access their own profile or scoped student profiles");
    }
    const studentUserIds = await getTeacherScopedStudentUserIds(actorUser.id);
    if (studentUserIds.includes(Number(profile.user_id))) return;
    throw new ForbiddenError("Student profile is outside the teacher classroom scope");
  }

  throw new ForbiddenError("Profile access denied");
};

const assertAdminOnly = (actorUser) => {
  if (!isRole(actorUser.role, ROLES.ADMIN)) {
    throw new ForbiddenError("Admin permission is required");
  }
};

const ensureUniqueProfile = async ({ tenantId, userId, profileType, excludeProfileId = null }) => {
  const where = {
    tenant_id: tenantId,
    user_id: userId,
    profile_type: profileType,
  };
  if (excludeProfileId) where.id = { [Op.ne]: excludeProfileId };
  const existing = await Profile.findOne({ where });
  if (existing) {
    throw new ConflictError("A profile of this type already exists for the user in this tenant");
  }
};

const ensureUniqueExtensionCode = async ({
  profileType,
  codeValue,
  tenantId,
  excludeProfileId = null,
}) => {
  if (!codeValue || !PROFILE_EXTENSION_MODELS[profileType]) return;
  const { model, as, codeField } = PROFILE_EXTENSION_MODELS[profileType];

  const existing = await model.findOne({
    where: { [codeField]: codeValue },
    include: [
      {
        model: Profile,
        as: "profile",
        required: true,
        where: {
          tenant_id: tenantId,
          ...(excludeProfileId ? { id: { [Op.ne]: excludeProfileId } } : {}),
        },
      },
    ],
  });

  if (existing) {
    throw new ConflictError(`${codeField} already exists in this tenant`);
  }
};

const buildProfileSummary = (profile) => ({
  profile_id: profile.id,
  user_id: profile.user_id,
  tenant_id: profile.tenant_id,
  profile_type: profile.profile_type,
  display_name: profile.display_name || profile.full_name,
  avatar_url: profile.avatar_url,
  status: profile.status,
  student_code: profile.student_profile?.student_code || null,
  teacher_code: profile.teacher_profile?.teacher_code || null,
});

const getActorDefaultProfileType = (actorUser) => {
  const actorRole = normalizeRole(actorUser.role);
  if (actorRole === ROLES.STUDENT) return PROFILE_TYPES.STUDENT;
  if (actorRole === ROLES.PARENT) return PROFILE_TYPES.PARENT;
  if (actorRole === ROLES.TEACHER) return PROFILE_TYPES.TEACHER;
  return null;
};

const listProfiles = async (
  { tenantId, profileType, status, search, page = 1, limit = 20 } = {},
  actorUser
) => {
  const actorTenantId = await resolveActorTenantId(actorUser, tenantId);
  const actorRole = normalizeRole(actorUser.role);
  const where = { tenant_id: actorTenantId };
  const andConditions = [];

  if (profileType) where.profile_type = profileType;
  if (status) where.status = status;
  if (search) {
    andConditions.push({
      [Op.or]: [
        { full_name: { [Op.like]: `%${search}%` } },
        { display_name: { [Op.like]: `%${search}%` } },
        { contact_email: { [Op.like]: `%${search}%` } },
      ],
    });
  }

  if (isRole(actorRole, ROLES.TEACHER)) {
    const studentUserIds = await getTeacherScopedStudentUserIds(actorUser.id);
    andConditions.push({
      [Op.or]: [
        { user_id: actorUser.id },
        {
          user_id: { [Op.in]: studentUserIds.length ? studentUserIds : [0] },
          profile_type: PROFILE_TYPES.STUDENT,
        },
      ],
    });
  } else {
    assertAdminOnly(actorUser);
  }

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  const numericPage = Number(page) || 1;
  const numericLimit = Number(limit) || 20;
  const offset = (numericPage - 1) * numericLimit;

  const { count, rows } = await Profile.findAndCountAll({
    where,
    include: resolveExtensionIncludes(),
    limit: numericLimit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    total: count,
    page: numericPage,
    limit: numericLimit,
    profiles: rows,
  };
};

const getProfileById = async (profileId, actorUser) => {
  const profile = await getProfileByIdInternal(profileId);
  await assertProfileAccess(profile, actorUser);
  return profile;
};

const getMyProfile = async (actorUser, profileType = null) => {
  const tenantId = await resolveActorTenantId(actorUser);
  const resolvedProfileType = profileType || getActorDefaultProfileType(actorUser);
  const profile = await findUserProfile(actorUser.id, tenantId, resolvedProfileType);
  if (!profile) throw new NotFoundError("Profile not found");
  return profile;
};

const getProfileSummary = async (profileId, actorUser) => {
  const profile = await getProfileById(profileId, actorUser);
  return buildProfileSummary(profile);
};

const getMyProfileSummary = async (actorUser, profileType = null) => {
  const profile = await getMyProfile(actorUser, profileType);
  return buildProfileSummary(profile);
};

const createProfile = async (data, actorUser) => {
  assertAdminOnly(actorUser);
  ensureNoForbiddenFields(data);
  validateProfileData(data);

  const profileType = data.profileType;
  const tenantId = await resolveActorTenantId(actorUser, data.tenantId || data.tenant_id);
  const status = data.status || PROFILE_STATUSES.DRAFT;
  const expertise = normalizeExpertise(data.expertise);

  const user = await User.findByPk(data.userId);
  if (!user) throw new NotFoundError("User identity not found");

  await ensureUniqueProfile({
    tenantId,
    userId: data.userId,
    profileType,
  });

  if (profileType === PROFILE_TYPES.STUDENT) {
    await ensureUniqueExtensionCode({
      profileType,
      codeValue: data.studentCode,
      tenantId,
    });
  }
  if (profileType === PROFILE_TYPES.PARENT) {
    await ensureUniqueExtensionCode({
      profileType,
      codeValue: data.parentCode,
      tenantId,
    });
  }
  if (profileType === PROFILE_TYPES.TEACHER) {
    await ensureUniqueExtensionCode({
      profileType,
      codeValue: data.teacherCode,
      tenantId,
    });
  }

  const createdProfile = await sequelize.transaction(async (transaction) => {
    const profile = await Profile.create(
      {
        tenant_id: tenantId,
        user_id: data.userId,
        profile_type: profileType,
        full_name: data.fullName.trim(),
        display_name: data.displayName || null,
        avatar_url: data.avatarUrl || null,
        contact_email: data.contactEmail || null,
        phone_number: data.phoneNumber || null,
        address: data.address || null,
        status,
        visibility: data.visibility || "internal",
        created_by: actorUser.id,
        updated_by: actorUser.id,
      },
      { transaction }
    );

    if (profileType === PROFILE_TYPES.STUDENT) {
      await StudentProfile.create(
        {
          profile_id: profile.id,
          student_code: data.studentCode || null,
          date_of_birth: data.dateOfBirth || null,
          gender: data.gender || null,
          current_level: data.currentLevel || null,
          learning_goal: data.learningGoal || null,
          student_status: data.studentStatus || (status === PROFILE_STATUSES.ACTIVE ? "active" : null),
        },
        { transaction }
      );
    }

    if (profileType === PROFILE_TYPES.PARENT) {
      await ParentProfile.create(
        {
          profile_id: profile.id,
          parent_code: data.parentCode || null,
          occupation: data.occupation || null,
          contact_priority: data.contactPriority ?? 1,
          emergency_contact_flag: data.emergencyContactFlag ?? false,
        },
        { transaction }
      );
    }

    if (profileType === PROFILE_TYPES.TEACHER) {
      await TeacherProfile.create(
        {
          profile_id: profile.id,
          teacher_code: data.teacherCode || null,
          bio: data.bio || null,
          expertise: expertise ?? null,
          qualification: data.qualification || null,
          years_of_experience: data.yearsOfExperience ?? 0,
          public_profile_enabled: data.publicProfileEnabled ?? false,
        },
        { transaction }
      );
    }

    await writeAuditLog({
      entityType: "Profile",
      entityId: profile.id,
      action: "CREATE",
      actorId: actorUser.id,
      newValues: {
        tenant_id: tenantId,
        user_id: data.userId,
        profile_type: profileType,
        status,
      },
      transaction,
    });

    return profile.id;
  });

  return getProfileByIdInternal(createdProfile);
};

const updateProfile = async (profileId, data, actorUser) => {
  ensureNoForbiddenFields(data);
  validateProfileData(data, { partial: true });

  const profile = await getProfileByIdInternal(profileId);
  const isAdmin = isRole(actorUser.role, ROLES.ADMIN);
  const isOwner = Number(profile.user_id) === Number(actorUser.id);

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError("Insufficient permissions to update this profile");
  }

  if (!isAdmin && [PROFILE_STATUSES.INACTIVE, PROFILE_STATUSES.ARCHIVED].includes(profile.status)) {
    throw new ForbiddenError("Inactive or archived profiles cannot be self-updated");
  }

  const allowedBaseFields = isAdmin
    ? ADMIN_EDITABLE_BASE_FIELDS
    : OWNER_EDITABLE_FIELDS[profile.profile_type] || [];
  const allowedExtensionFields = isAdmin
    ? ADMIN_EDITABLE_EXTENSION_FIELDS
    : OWNER_EDITABLE_EXTENSION_FIELDS[profile.profile_type] || [];

  const baseUpdates = pickUpdates(data, allowedBaseFields);
  const extensionUpdates = pickUpdates(data, allowedExtensionFields);
  if (extensionUpdates.expertise !== undefined) {
    extensionUpdates.expertise = normalizeExpertise(extensionUpdates.expertise);
  }
  if (extensionUpdates.date_of_birth !== undefined) {
    validateDateOfBirth(extensionUpdates.date_of_birth);
  }
  if (
    extensionUpdates.years_of_experience !== undefined &&
    Number(extensionUpdates.years_of_experience) < 0
  ) {
    throw new BadRequestError("yearsOfExperience must be greater than or equal to 0");
  }

  if (isAdmin) {
    await ensureUniqueExtensionCode({
      profileType: PROFILE_TYPES.STUDENT,
      codeValue: extensionUpdates.student_code,
      tenantId: profile.tenant_id,
      excludeProfileId: profile.id,
    });
    await ensureUniqueExtensionCode({
      profileType: PROFILE_TYPES.PARENT,
      codeValue: extensionUpdates.parent_code,
      tenantId: profile.tenant_id,
      excludeProfileId: profile.id,
    });
    await ensureUniqueExtensionCode({
      profileType: PROFILE_TYPES.TEACHER,
      codeValue: extensionUpdates.teacher_code,
      tenantId: profile.tenant_id,
      excludeProfileId: profile.id,
    });
  }

  const oldValues = profile.toJSON();

  await sequelize.transaction(async (transaction) => {
    if (Object.keys(baseUpdates).length) {
      Object.assign(profile, baseUpdates);
      profile.updated_by = actorUser.id;
      await profile.save({ transaction });
    }

    if (Object.keys(extensionUpdates).length) {
      if (profile.profile_type === PROFILE_TYPES.STUDENT && profile.student_profile) {
        await profile.student_profile.update(extensionUpdates, { transaction });
      } else if (profile.profile_type === PROFILE_TYPES.PARENT && profile.parent_profile) {
        await profile.parent_profile.update(extensionUpdates, { transaction });
      } else if (profile.profile_type === PROFILE_TYPES.TEACHER && profile.teacher_profile) {
        await profile.teacher_profile.update(extensionUpdates, { transaction });
      }
    }

    await writeAuditLog({
      entityType: "Profile",
      entityId: profile.id,
      action: "UPDATE",
      actorId: actorUser.id,
      oldValues: {
        full_name: oldValues.full_name,
        display_name: oldValues.display_name,
        status: oldValues.status,
      },
      newValues: {
        ...baseUpdates,
        ...extensionUpdates,
      },
      transaction,
    });
  });

  return getProfileByIdInternal(profileId);
};

const changeProfileStatus = async (profileId, newStatus, reason, actorUser) => {
  assertAdminOnly(actorUser);
  if (!Object.values(PROFILE_STATUSES).includes(newStatus)) {
    throw new BadRequestError("Invalid profile status");
  }

  const profile = await getProfileByIdInternal(profileId);
  const allowed = PROFILE_STATUS_TRANSITIONS[profile.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition profile status from '${profile.status}' to '${newStatus}'`
    );
  }

  await sequelize.transaction(async (transaction) => {
    const oldStatus = profile.status;
    profile.status = newStatus;
    profile.updated_by = actorUser.id;
    await profile.save({ transaction });

    await writeAuditLog({
      entityType: "Profile",
      entityId: profile.id,
      action: "CHANGE_STATUS",
      actorId: actorUser.id,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      reason,
      transaction,
    });
  });

  return getProfileByIdInternal(profileId);
};

const linkParentToStudent = async (
  { parentProfileId, studentProfileId, relationshipType = "guardian", relationshipStatus = RELATIONSHIP_STATUSES.ACTIVE },
  actorUser
) => {
  assertAdminOnly(actorUser);
  if (!["father", "mother", "guardian", "other"].includes(relationshipType)) {
    throw new BadRequestError("relationshipType is invalid");
  }
  if (![RELATIONSHIP_STATUSES.PENDING, RELATIONSHIP_STATUSES.ACTIVE].includes(relationshipStatus)) {
    throw new BadRequestError("relationshipStatus must be pending or active");
  }

  const parentProfile = await ParentProfile.findByPk(parentProfileId, {
    include: [{ model: Profile, as: "profile", required: true }],
  });
  if (!parentProfile) throw new NotFoundError("Parent profile not found");

  const studentProfile = await StudentProfile.findByPk(studentProfileId, {
    include: [{ model: Profile, as: "profile", required: true }],
  });
  if (!studentProfile) throw new NotFoundError("Student profile not found");

  if (Number(parentProfile.profile.tenant_id) !== Number(studentProfile.profile.tenant_id)) {
    throw new BadRequestError("Parent and student must belong to the same tenant");
  }

  const existing = await ParentStudentRelationship.findOne({
    where: {
      parent_profile_id: parentProfileId,
      student_profile_id: studentProfileId,
      status: { [Op.in]: [RELATIONSHIP_STATUSES.ACTIVE, RELATIONSHIP_STATUSES.PENDING] },
    },
  });
  if (existing) {
    throw new ConflictError("An active or pending relationship already exists for this parent and student");
  }

  const relationship = await sequelize.transaction(async (transaction) => {
    const createdRelationship = await ParentStudentRelationship.create(
      {
        tenant_id: parentProfile.profile.tenant_id,
        parent_profile_id: parentProfileId,
        student_profile_id: studentProfileId,
        relationship_type: relationshipType,
        status: relationshipStatus,
        start_date: new Date(),
        created_by: actorUser.id,
        updated_by: actorUser.id,
      },
      { transaction }
    );

    await writeAuditLog({
      entityType: "ParentStudentRelationship",
      entityId: createdRelationship.id,
      action: "LINK",
      actorId: actorUser.id,
      newValues: {
        parent_profile_id: parentProfileId,
        student_profile_id: studentProfileId,
        relationship_type: relationshipType,
        status: relationshipStatus,
      },
      transaction,
    });

    return createdRelationship;
  });

  return relationship;
};

const updateRelationshipStatus = async (relationshipId, newStatus, reason, actorUser) => {
  assertAdminOnly(actorUser);
  if (!Object.values(RELATIONSHIP_STATUSES).includes(newStatus)) {
    throw new BadRequestError("Invalid relationship status");
  }

  const relationship = await ParentStudentRelationship.findByPk(relationshipId);
  if (!relationship) throw new NotFoundError("Relationship not found");
  if (relationship.status === newStatus) return relationship;

  const action = newStatus === RELATIONSHIP_STATUSES.REVOKED ? "UNLINK" : "CHANGE_STATUS";

  await sequelize.transaction(async (transaction) => {
    const oldStatus = relationship.status;
    relationship.status = newStatus;
    relationship.reason = reason || relationship.reason || null;
    relationship.updated_by = actorUser.id;
    relationship.end_date =
      newStatus === RELATIONSHIP_STATUSES.REVOKED ? new Date() : relationship.end_date;
    await relationship.save({ transaction });

    await writeAuditLog({
      entityType: "ParentStudentRelationship",
      entityId: relationship.id,
      action,
      actorId: actorUser.id,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      reason,
      transaction,
    });
  });

  return ParentStudentRelationship.findByPk(relationshipId);
};

const unlinkParentStudent = async (relationshipId, reason, actorUser) =>
  updateRelationshipStatus(relationshipId, RELATIONSHIP_STATUSES.REVOKED, reason, actorUser);

const getLinkedStudents = async (parentProfileId, actorUser) => {
  const parentProfile = await ParentProfile.findByPk(parentProfileId, {
    include: [{ model: Profile, as: "profile", required: true }],
  });
  if (!parentProfile) throw new NotFoundError("Parent profile not found");

  if (!isRole(actorUser.role, ROLES.ADMIN) && Number(parentProfile.profile.user_id) !== Number(actorUser.id)) {
    throw new ForbiddenError("Parent profile is outside your scope");
  }

  const actorTenantId = await resolveActorTenantId(actorUser);
  if (Number(parentProfile.profile.tenant_id) !== Number(actorTenantId)) {
    throw new ForbiddenError("Parent profile is outside the active tenant scope");
  }

  const relationships = await ParentStudentRelationship.findAll({
    where: {
      parent_profile_id: parentProfileId,
      status: RELATIONSHIP_STATUSES.ACTIVE,
    },
    include: [
      {
        model: StudentProfile,
        as: "student_profile",
        required: true,
        include: [
          {
            model: Profile,
            as: "profile",
            required: true,
            where: {
              status: { [Op.notIn]: [PROFILE_STATUSES.ARCHIVED] },
            },
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return relationships.map((relationship) => ({
    relationship_id: relationship.id,
    relationship_type: relationship.relationship_type,
    status: relationship.status,
    student_profile_id: relationship.student_profile_id,
    student: buildProfileSummary(relationship.student_profile.profile),
  }));
};

const getMyLinkedStudents = async (actorUser) => {
  const tenantId = await resolveActorTenantId(actorUser);
  const myParentProfile = await findUserProfile(actorUser.id, tenantId, PROFILE_TYPES.PARENT);
  if (!myParentProfile || !myParentProfile.parent_profile) {
    throw new NotFoundError("Parent profile not found");
  }
  return getLinkedStudents(myParentProfile.parent_profile.id, actorUser);
};

const exportProfiles = async ({ tenantId, profileType, status, search } = {}, actorUser) => {
  assertAdminOnly(actorUser);
  const actorTenantId = await resolveActorTenantId(actorUser, tenantId);
  const { profiles } = await listProfiles(
    {
      tenantId: actorTenantId,
      profileType,
      status,
      search,
      page: 1,
      limit: 1000,
    },
    actorUser
  );

  const rows = profiles.map((profile) => ({
    profile_id: profile.id,
    tenant_id: profile.tenant_id,
    user_id: profile.user_id,
    profile_type: profile.profile_type,
    full_name: profile.full_name,
    display_name: profile.display_name,
    contact_email: profile.contact_email,
    phone_number: profile.phone_number,
    status: profile.status,
    visibility: profile.visibility,
    student_code: profile.student_profile?.student_code || null,
    parent_code: profile.parent_profile?.parent_code || null,
    teacher_code: profile.teacher_profile?.teacher_code || null,
    exported_at: new Date().toISOString(),
  }));

  await writeAuditLog({
    entityType: "Profile",
    entityId: 0,
    action: "EXPORT",
    actorId: actorUser.id,
    newValues: {
      tenant_id: actorTenantId,
      profile_type: profileType || null,
      status: status || null,
      count: rows.length,
    },
  });

  return {
    tenant_id: actorTenantId,
    count: rows.length,
    exported_at: new Date(),
    rows,
  };
};

const getAuditLogs = async (profileId, actorUser) => {
  assertAdminOnly(actorUser);
  const profile = await getProfileByIdInternal(profileId);
  const actorTenantId = await resolveActorTenantId(actorUser);
  if (Number(profile.tenant_id) !== Number(actorTenantId)) {
    throw new ForbiddenError("Profile audit log is outside the active tenant scope");
  }

  let relationshipIds = [];
  if (profile.parent_profile) {
    const relationships = await ParentStudentRelationship.findAll({
      where: { parent_profile_id: profile.parent_profile.id },
      attributes: ["id"],
    });
    relationshipIds = relationships.map((relationship) => relationship.id);
  } else if (profile.student_profile) {
    const relationships = await ParentStudentRelationship.findAll({
      where: { student_profile_id: profile.student_profile.id },
      attributes: ["id"],
    });
    relationshipIds = relationships.map((relationship) => relationship.id);
  }

  const auditWhere = relationshipIds.length
    ? {
        [Op.or]: [
          { entity_name: "Profile", entity_id: profileId },
          {
            entity_name: "ParentStudentRelationship",
            entity_id: { [Op.in]: relationshipIds },
          },
        ],
      }
    : { entity_name: "Profile", entity_id: profileId };

  return AuditLog.findAll({
    where: auditWhere,
    order: [["changed_at", "DESC"]],
  });
};

module.exports = {
  PROFILE_TYPES,
  PROFILE_STATUSES,
  RELATIONSHIP_STATUSES,
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
