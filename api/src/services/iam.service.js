const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/error-responses");
const {
  ACCOUNT_STATUSES,
  IAM_PERMISSION_DEFINITIONS,
  MEMBERSHIP_STATUSES,
  ROLE_ASSIGNMENT_STATUSES,
  SESSION_STATUSES,
  SCOPE_TYPES,
} = require("../constants/iam");
const { normalizeRole, ROLES } = require("../constants/roles");
const {
  IamAuditLog,
  IamMembership,
  IamRoleAssignment,
  IamSession,
  IamUserAccount,
  Permission,
  Role,
  RolePermission,
  Tenant,
  User,
} = require("../models");

const ACTIVE_MEMBERSHIP_STATUSES = [MEMBERSHIP_STATUSES.ACTIVE];
const ACTIVE_ROLE_ASSIGNMENT_STATUSES = [ROLE_ASSIGNMENT_STATUSES.ACTIVE];
const DEFAULT_LOGIN_METHODS = ["email_password"];

const now = () => new Date();

const isNotExpired = (value) => !value || new Date(value) > now();

const toPlain = (instance) =>
  instance && typeof instance.get === "function" ? instance.get({ plain: true }) : instance;

const uniqBy = (items, keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatTenant = (tenantInstance) => {
  if (!tenantInstance) return null;
  const tenant = toPlain(tenantInstance);
  return {
    id: tenant.id,
    tenantCode: tenant.tenant_code,
    tenantName: tenant.tenant_name,
    status: tenant.status,
  };
};

const formatMembership = (membershipInstance) => {
  if (!membershipInstance) return null;
  const membership = toPlain(membershipInstance);
  return {
    id: membership.id,
    userId: membership.user_id,
    tenantId: membership.tenant_id,
    scopeType: membership.scope_type,
    scopeRefId: membership.scope_ref_id,
    status: membership.status,
    expiresAt: membership.expires_at,
    tenant: formatTenant(membership.tenant),
  };
};

const formatPermission = (permissionInstance) => {
  if (!permissionInstance) return null;
  const permission = toPlain(permissionInstance);
  return {
    id: permission.id,
    code: permission.code,
    description: permission.description,
    module: permission.module,
    resource: permission.resource,
    action: permission.action,
    isSystem: permission.is_system,
  };
};

const formatRole = (roleInstance) => {
  if (!roleInstance) return null;
  const role = toPlain(roleInstance);
  return {
    id: role.id,
    name: normalizeRole(role.name) || role.name,
    permissions: Array.isArray(role.permissions) ? role.permissions.map(formatPermission) : undefined,
  };
};

const formatSession = (sessionInstance) => {
  if (!sessionInstance) return null;
  const session = toPlain(sessionInstance);
  return {
    id: session.id,
    userId: session.user_id,
    activeTenantId: session.active_tenant_id,
    status: session.status,
    expiresAt: session.expires_at,
    lastUsedAt: session.last_used_at,
    revokedAt: session.revoked_at,
    revokedReason: session.revoked_reason,
  };
};

const buildUserResponse = (
  userInstance,
  { memberships = [], permissions = [], roles = [], activeTenantId = null } = {}
) => {
  if (!userInstance) return null;
  const user = toPlain(userInstance);
  const account = user.iam_account || user.iamAccount || null;
  const role = normalizeRole(user.role?.name || user.role) || user.role?.name || user.role;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName,
    role,
    status: account?.status || ACCOUNT_STATUSES.ACTIVE,
    username: account?.username || null,
    phone: account?.phone || null,
    activeTenantId,
    roles,
    permissions,
    memberships,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
  };
};

const buildActiveMembershipWhere = (userId) => ({
  user_id: userId,
  status: { [Op.in]: ACTIVE_MEMBERSHIP_STATUSES },
  [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now() } }],
});

const buildActiveRoleAssignmentWhere = (userId, tenantId) => ({
  user_id: userId,
  tenant_id: tenantId,
  status: { [Op.in]: ACTIVE_ROLE_ASSIGNMENT_STATUSES },
  [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now() } }],
});

const ensureIamAccount = async (userOrId, defaults = {}) => {
  const userId = typeof userOrId === "object" ? userOrId.id : userOrId;
  if (!userId) throw new BadRequestError("userId is required");

  let account =
    typeof userOrId === "object"
      ? userOrId.iam_account || userOrId.iamAccount || null
      : await IamUserAccount.findOne({ where: { user_id: userId } });

  if (!account) {
    account = await IamUserAccount.create({
      user_id: userId,
      status: defaults.status || ACCOUNT_STATUSES.ACTIVE,
      login_methods: defaults.loginMethods || DEFAULT_LOGIN_METHODS,
      username: defaults.username || null,
      phone: defaults.phone || null,
    });
  }

  return account;
};

const getUserWithIam = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      { model: Role, as: "role" },
      { model: IamUserAccount, as: "iam_account" },
    ],
  });
  if (!user) throw new NotFoundError("User not found");
  await ensureIamAccount(user);
  return User.findByPk(userId, {
    include: [
      { model: Role, as: "role" },
      { model: IamUserAccount, as: "iam_account" },
    ],
  });
};

const assertUserAccountActive = async (userInstance) => {
  const account =
    userInstance?.iam_account ||
    userInstance?.iamAccount ||
    (await ensureIamAccount(userInstance || userInstance?.id));

  if (account.status === ACCOUNT_STATUSES.ACTIVE) return account;

  if (account.status === ACCOUNT_STATUSES.LOCKED) {
    throw new UnauthorizedError("Account locked", { errorCode: "AUTH_ACCOUNT_LOCKED" });
  }

  throw new UnauthorizedError("Account inactive", { errorCode: "AUTH_ACCOUNT_INACTIVE" });
};

const listMemberships = async (userId, { validOnly = false } = {}) => {
  const where = validOnly ? buildActiveMembershipWhere(userId) : { user_id: userId };
  return IamMembership.findAll({
    where,
    include: [{ model: Tenant, as: "tenant" }],
    order: [
      ["tenant_id", "ASC"],
      ["scope_type", "ASC"],
      ["scope_ref_id", "ASC"],
    ],
  });
};

const resolveTenantMemberships = async (userId) => {
  const memberships = await listMemberships(userId, { validOnly: true });
  const tenantScoped = memberships.filter((membership) => membership.tenant?.status !== "inactive");

  if (!tenantScoped.length) {
    throw new ForbiddenError("No active tenant membership", {
      errorCode: "IAM_NO_TENANT_MEMBERSHIP",
    });
  }

  return tenantScoped;
};

const resolveActiveTenant = (memberships, requestedTenantId = null) => {
  if (!memberships.length) return null;

  if (requestedTenantId) {
    const membership = memberships.find((item) => item.tenant_id === Number(requestedTenantId));
    if (!membership) {
      throw new ForbiddenError("Tenant access denied", {
        errorCode: "IAM_TENANT_ACCESS_DENIED",
      });
    }
    return membership.tenant;
  }

  const tenantIds = [...new Set(memberships.map((item) => item.tenant_id))];
  if (tenantIds.length === 1) return memberships[0].tenant;

  return null;
};

const getPermissionsForRoles = async (roleIds) => {
  if (!roleIds.length) return [];
  const permissions = await Permission.findAll({
    include: [
      {
        model: Role,
        as: "roles",
        through: { attributes: [] },
        where: { id: { [Op.in]: roleIds } },
        required: true,
      },
    ],
    order: [["code", "ASC"]],
  });
  return uniqBy(permissions, (permission) => permission.id);
};

const resolveAuthorizationContext = async (userInstanceOrId, activeTenantId = null, options = {}) => {
  const user =
    typeof userInstanceOrId === "object" && userInstanceOrId?.id
      ? userInstanceOrId
      : await getUserWithIam(userInstanceOrId);
  const memberships = options.memberships || (await resolveTenantMemberships(user.id));
  const activeMemberships = activeTenantId
    ? memberships.filter((membership) => membership.tenant_id === Number(activeTenantId))
    : [];

  const roleAssignments = activeTenantId
    ? await IamRoleAssignment.findAll({
        where: buildActiveRoleAssignmentWhere(user.id, Number(activeTenantId)),
        include: [{ model: Role, as: "role" }],
      })
    : [];

  const roles = [];
  const baseRole = user.role
    ? { id: user.role.id, name: normalizeRole(user.role.name) || user.role.name }
    : null;

  if (baseRole) roles.push(baseRole);
  for (const assignment of roleAssignments) {
    if (assignment.role) {
      roles.push({ id: assignment.role.id, name: normalizeRole(assignment.role.name) || assignment.role.name });
    }
  }

  const uniqueRoles = uniqBy(roles, (role) => `${role.id}:${role.name}`);
  const permissions = activeTenantId
    ? (await getPermissionsForRoles(uniqueRoles.map((role) => role.id))).map(formatPermission)
    : [];

  return {
    user,
    activeTenantId: activeTenantId ? Number(activeTenantId) : null,
    activeTenant: activeMemberships[0]?.tenant || null,
    memberships: memberships.map(formatMembership),
    activeMemberships: activeMemberships.map(formatMembership),
    roles: uniqueRoles,
    permissions,
  };
};

const hasPermission = (context, permissionCode) =>
  Boolean(context?.permissions?.some((permission) => permission.code === permissionCode));

const assertPermission = (context, permissionCode) => {
  if (hasPermission(context, permissionCode)) return;
  throw new ForbiddenError("Permission denied", { errorCode: "IAM_PERMISSION_DENIED" });
};

const scopeMatches = (memberships, requestedScopeType, requestedScopeRefId) => {
  if (!requestedScopeType) return true;

  return memberships.some((membership) => {
    if (membership.scopeType === SCOPE_TYPES.TENANT) return true;
    return (
      membership.scopeType === requestedScopeType &&
      String(membership.scopeRefId || "") === String(requestedScopeRefId || "")
    );
  });
};

const authorizeAccess = async ({
  userId,
  activeTenantId,
  requiredPermission,
  requestedScopeType,
  requestedScopeRefId,
}) => {
  if (!activeTenantId) {
    return {
      allow: false,
      code: "IAM_TENANT_CONTEXT_REQUIRED",
      reason: "Tenant context is required",
    };
  }

  const context = await resolveAuthorizationContext(userId, activeTenantId);
  if (!context.activeMemberships.length) {
    return {
      allow: false,
      code: "IAM_TENANT_ACCESS_DENIED",
      reason: "Tenant access denied",
    };
  }

  if (requiredPermission && !hasPermission(context, requiredPermission)) {
    return {
      allow: false,
      code: "IAM_PERMISSION_DENIED",
      reason: "Permission denied",
    };
  }

  if (!scopeMatches(context.activeMemberships, requestedScopeType, requestedScopeRefId)) {
    return {
      allow: false,
      code: "IAM_SCOPE_ACCESS_DENIED",
      reason: "Scope access denied",
    };
  }

  return {
    allow: true,
    code: "ALLOW",
    reason: "Authorized",
    context,
  };
};

const getRequestMeta = (req = {}) => ({
  ipAddress: req.ip || req.headers?.["x-forwarded-for"] || null,
  userAgent: req.headers?.["user-agent"] || null,
});

const recordAuditLog = async ({
  actorUserId = null,
  tenantId = null,
  action,
  entityType,
  entityId = null,
  status = "success",
  details = null,
  req = null,
}) => {
  if (!action || !entityType) return null;
  const meta = getRequestMeta(req || {});
  return IamAuditLog.create({
    actor_user_id: actorUserId,
    tenant_id: tenantId,
    action,
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    status,
    details,
    ip_address: meta.ipAddress,
    user_agent: meta.userAgent,
  });
};

const resolveRole = async ({ roleId, roleName }) => {
  if (roleId) {
    const role = await Role.findByPk(roleId);
    if (!role) throw new NotFoundError("Role not found", { errorCode: "IAM_ROLE_NOT_FOUND" });
    return role;
  }

  if (roleName) {
    const normalized = normalizeRole(roleName) || roleName;
    const role = await Role.findOne({ where: { name: normalized } });
    if (!role) throw new NotFoundError("Role not found", { errorCode: "IAM_ROLE_NOT_FOUND" });
    return role;
  }

  return null;
};

const resolveTenant = async (tenantId) => {
  if (!tenantId) throw new BadRequestError("tenantId is required");
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new NotFoundError("Tenant not found");
  return tenant;
};

const ensureMembership = async ({
  userId,
  tenantId,
  scopeType = SCOPE_TYPES.TENANT,
  scopeRefId = null,
  status = MEMBERSHIP_STATUSES.ACTIVE,
  expiresAt = null,
  actorUserId = null,
}) => {
  let membership = await IamMembership.findOne({
    where: {
      user_id: userId,
      tenant_id: tenantId,
      scope_type: scopeType,
      scope_ref_id: scopeRefId,
    },
  });

  if (!membership) {
    membership = await IamMembership.create({
      user_id: userId,
      tenant_id: tenantId,
      scope_type: scopeType,
      scope_ref_id: scopeRefId,
      status,
      expires_at: expiresAt,
      created_by: actorUserId,
      updated_by: actorUserId,
    });
  } else {
    membership.status = status;
    membership.expires_at = expiresAt;
    membership.updated_by = actorUserId;
    await membership.save();
  }

  return membership;
};

const ensureRoleAssignment = async ({
  userId,
  tenantId,
  roleId,
  scopeType = SCOPE_TYPES.TENANT,
  scopeRefId = null,
  status = ROLE_ASSIGNMENT_STATUSES.ACTIVE,
  expiresAt = null,
  actorUserId = null,
}) => {
  let assignment = await IamRoleAssignment.findOne({
    where: {
      user_id: userId,
      tenant_id: tenantId,
      role_id: roleId,
      scope_type: scopeType,
      scope_ref_id: scopeRefId,
    },
  });

  if (!assignment) {
    assignment = await IamRoleAssignment.create({
      user_id: userId,
      tenant_id: tenantId,
      role_id: roleId,
      scope_type: scopeType,
      scope_ref_id: scopeRefId,
      status,
      expires_at: expiresAt,
      assigned_by: actorUserId,
    });
  } else {
    assignment.status = status;
    assignment.expires_at = expiresAt;
    assignment.assigned_by = actorUserId;
    await assignment.save();
  }

  return assignment;
};

const getDefaultTenant = async () => {
  const defaultTenant = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (defaultTenant) return defaultTenant;
  return Tenant.findOne({ order: [["id", "ASC"]] });
};

const listUsers = async () => {
  const users = await User.findAll({
    include: [
      { model: Role, as: "role" },
      { model: IamUserAccount, as: "iam_account" },
      {
        model: IamMembership,
        as: "memberships",
        include: [{ model: Tenant, as: "tenant" }],
      },
    ],
    order: [["id", "ASC"]],
  });

  return users.map((user) =>
    buildUserResponse(user, {
      memberships: (user.memberships || []).map(formatMembership),
      activeTenantId: null,
    })
  );
};

const createUser = async (payload, actor, req) => {
  const { email, password, fullName, roleId, roleName, username, phone, status, tenantId } = payload;
  if (!email || !password || !fullName) throw new BadRequestError("Missing required fields");

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) throw new ConflictError("Duplicate account", { errorCode: "IAM_DUPLICATE_ACCOUNT" });

  if (username) {
    const existingUsername = await IamUserAccount.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictError("Duplicate account", { errorCode: "IAM_DUPLICATE_ACCOUNT" });
    }
  }

  if (phone) {
    const existingPhone = await IamUserAccount.findOne({ where: { phone } });
    if (existingPhone) throw new ConflictError("Duplicate account", { errorCode: "IAM_DUPLICATE_ACCOUNT" });
  }

  const role = (await resolveRole({ roleId, roleName })) || (await resolveRole({ roleName: ROLES.STUDENT }));
  const user = await User.create({
    email,
    password_hash: await bcrypt.hash(password, 10),
    full_name: fullName,
    role_id: role.id,
  });

  await ensureIamAccount(user.id, { status: status || ACCOUNT_STATUSES.ACTIVE, username, phone });
  const tenant = tenantId ? await resolveTenant(tenantId) : await getDefaultTenant();
  if (tenant) {
    await ensureMembership({ userId: user.id, tenantId: tenant.id, actorUserId: actor.id });
    await ensureRoleAssignment({
      userId: user.id,
      tenantId: tenant.id,
      roleId: role.id,
      actorUserId: actor.id,
    });
  }

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: tenant?.id || null,
    action: "iam.user.create",
    entityType: "user",
    entityId: user.id,
    details: { email, roleId: role.id },
    req,
  });

  return getUserWithIam(user.id);
};

const updateUser = async (userId, payload, actor, req) => {
  const user = await getUserWithIam(userId);
  const role = payload.roleId || payload.roleName ? await resolveRole(payload) : null;

  if (payload.email && payload.email !== user.email) {
    const existingEmail = await User.findOne({ where: { email: payload.email } });
    if (existingEmail) throw new ConflictError("Duplicate account", { errorCode: "IAM_DUPLICATE_ACCOUNT" });
    user.email = payload.email;
  }

  if (payload.fullName) user.full_name = payload.fullName;
  if (role) user.role_id = role.id;
  if (payload.password) user.password_hash = await bcrypt.hash(payload.password, 10);
  await user.save();

  const account = await ensureIamAccount(user);
  if (typeof payload.username !== "undefined") account.username = payload.username || null;
  if (typeof payload.phone !== "undefined") account.phone = payload.phone || null;
  if (payload.status) account.status = payload.status;
  if (payload.loginMethods) account.login_methods = payload.loginMethods;
  await account.save();

  let tenantId = payload.tenantId || null;
  if (tenantId && role) {
    await ensureMembership({ userId: user.id, tenantId, actorUserId: actor.id });
    await ensureRoleAssignment({
      userId: user.id,
      tenantId,
      roleId: role.id,
      actorUserId: actor.id,
    });
  }

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId,
    action: "iam.user.update",
    entityType: "user",
    entityId: user.id,
    details: payload,
    req,
  });

  return getUserWithIam(user.id);
};

const listRoles = async () => {
  const roles = await Role.findAll({
    include: [{ model: Permission, as: "permissions", through: { attributes: [] } }],
    order: [["id", "ASC"]],
  });
  return roles.map(formatRole);
};

const createRole = async ({ name }, actor, req) => {
  if (!name) throw new BadRequestError("name is required");
  const normalizedName = normalizeRole(name) || name.trim();
  const existing = await Role.findOne({ where: { name: normalizedName } });
  if (existing) throw new ConflictError("Role already exists");
  const role = await Role.create({ name: normalizedName });
  await recordAuditLog({
    actorUserId: actor.id,
    action: "iam.role.create",
    entityType: "role",
    entityId: role.id,
    details: { name: normalizedName },
    req,
  });
  return role;
};

const updateRole = async (roleId, { name }, actor, req) => {
  const role = await Role.findByPk(roleId);
  if (!role) throw new NotFoundError("Role not found", { errorCode: "IAM_ROLE_NOT_FOUND" });
  if (name) role.name = normalizeRole(name) || name.trim();
  await role.save();
  await recordAuditLog({
    actorUserId: actor.id,
    action: "iam.role.update",
    entityType: "role",
    entityId: role.id,
    details: { name: role.name },
    req,
  });
  return role;
};

const listPermissions = async () => {
  const permissions = await Permission.findAll({ order: [["code", "ASC"]] });
  return permissions.map(formatPermission);
};

const addRolePermission = async ({ roleId, permissionId, permissionCode }, actor, req) => {
  const role = await Role.findByPk(roleId);
  if (!role) throw new NotFoundError("Role not found", { errorCode: "IAM_ROLE_NOT_FOUND" });

  const permission = permissionId
    ? await Permission.findByPk(permissionId)
    : await Permission.findOne({ where: { code: permissionCode } });
  if (!permission) {
    throw new NotFoundError("Permission not found", { errorCode: "IAM_PERMISSION_NOT_FOUND" });
  }

  await RolePermission.findOrCreate({
    where: { role_id: role.id, permission_id: permission.id },
    defaults: { role_id: role.id, permission_id: permission.id },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    action: "iam.permission.map",
    entityType: "role_permission",
    entityId: `${role.id}:${permission.id}`,
    details: { roleId: role.id, permissionId: permission.id },
    req,
  });

  return { roleId: role.id, permission: formatPermission(permission) };
};

const removeRolePermission = async ({ roleId, permissionId, permissionCode }, actor, req) => {
  const permission = permissionId
    ? await Permission.findByPk(permissionId)
    : await Permission.findOne({ where: { code: permissionCode } });
  if (!permission) {
    throw new NotFoundError("Permission not found", { errorCode: "IAM_PERMISSION_NOT_FOUND" });
  }

  await RolePermission.destroy({ where: { role_id: roleId, permission_id: permission.id } });
  await recordAuditLog({
    actorUserId: actor.id,
    action: "iam.permission.unmap",
    entityType: "role_permission",
    entityId: `${roleId}:${permission.id}`,
    details: { roleId, permissionId: permission.id },
    req,
  });

  return { roleId, permissionId: permission.id };
};

const createMembership = async (payload, actor, req) => {
  const { userId, tenantId, scopeType, scopeRefId, status, expiresAt, roleId, roleName } = payload;
  await getUserWithIam(userId);
  await resolveTenant(tenantId);
  const membership = await ensureMembership({
    userId,
    tenantId,
    scopeType,
    scopeRefId,
    status: status || MEMBERSHIP_STATUSES.ACTIVE,
    expiresAt: expiresAt || null,
    actorUserId: actor.id,
  });

  const role = await resolveRole({ roleId, roleName });
  if (role) {
    await ensureRoleAssignment({
      userId,
      tenantId,
      roleId: role.id,
      scopeType: scopeType || SCOPE_TYPES.TENANT,
      scopeRefId: scopeRefId || null,
      actorUserId: actor.id,
    });
  }

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId,
    action: "iam.membership.assign",
    entityType: "membership",
    entityId: membership.id,
    details: payload,
    req,
  });

  return IamMembership.findByPk(membership.id, { include: [{ model: Tenant, as: "tenant" }] });
};

const updateMembership = async (membershipId, payload, actor, req) => {
  const membership = await IamMembership.findByPk(membershipId, { include: [{ model: Tenant, as: "tenant" }] });
  if (!membership) throw new NotFoundError("Membership not found");
  if (payload.scopeType) membership.scope_type = payload.scopeType;
  if (typeof payload.scopeRefId !== "undefined") membership.scope_ref_id = payload.scopeRefId;
  if (payload.status) membership.status = payload.status;
  if (typeof payload.expiresAt !== "undefined") membership.expires_at = payload.expiresAt;
  membership.updated_by = actor.id;
  await membership.save();

  if (membership.status === MEMBERSHIP_STATUSES.REVOKED) {
    await IamSession.update(
      {
        status: SESSION_STATUSES.REVOKED,
        revoked_at: now(),
        revoked_reason: "membership_revoked",
      },
      {
        where: {
          user_id: membership.user_id,
          active_tenant_id: membership.tenant_id,
          status: SESSION_STATUSES.ACTIVE,
        },
      }
    );
  }

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: membership.tenant_id,
    action: "iam.membership.update",
    entityType: "membership",
    entityId: membership.id,
    details: payload,
    req,
  });

  return membership.reload({ include: [{ model: Tenant, as: "tenant" }] });
};

const deleteMembership = async (membershipId, actor, req) => {
  const membership = await IamMembership.findByPk(membershipId);
  if (!membership) throw new NotFoundError("Membership not found");
  membership.status = MEMBERSHIP_STATUSES.REVOKED;
  membership.updated_by = actor.id;
  await membership.save();

  await IamSession.update(
    {
      status: SESSION_STATUSES.REVOKED,
      revoked_at: now(),
      revoked_reason: "membership_revoked",
    },
    {
      where: {
        user_id: membership.user_id,
        active_tenant_id: membership.tenant_id,
        status: SESSION_STATUSES.ACTIVE,
      },
    }
  );

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: membership.tenant_id,
    action: "iam.membership.revoke",
    entityType: "membership",
    entityId: membership.id,
    details: { membershipId },
    req,
  });

  return { id: membership.id, status: membership.status };
};

const listAuditLogs = async ({ tenantId, actorUserId } = {}) => {
  const where = {};
  if (tenantId) where.tenant_id = tenantId;
  if (actorUserId) where.actor_user_id = actorUserId;
  const logs = await IamAuditLog.findAll({
    where,
    include: [
      { model: User, as: "actor", attributes: ["id", "email", "full_name"] },
      { model: Tenant, as: "tenant" },
    ],
    order: [["created_at", "DESC"]],
  });

  return logs.map((entry) => {
    const log = toPlain(entry);
    return {
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      status: log.status,
      details: log.details,
      actor: log.actor
        ? { id: log.actor.id, email: log.actor.email, fullName: log.actor.full_name }
        : null,
      tenant: formatTenant(log.tenant),
      createdAt: log.created_at,
    };
  });
};

const revokeSession = async ({ sessionId, refreshToken, reason = "manual_revoke" }, actor, req) => {
  const session = await IamSession.findOne({
    where: sessionId ? { id: sessionId } : { refresh_token: refreshToken },
  });
  if (!session) throw new NotFoundError("Session not found");

  session.status = SESSION_STATUSES.REVOKED;
  session.revoked_at = now();
  session.revoked_reason = reason;
  await session.save();

  await recordAuditLog({
    actorUserId: actor.id,
    tenantId: session.active_tenant_id,
    action: "iam.session.revoke",
    entityType: "session",
    entityId: session.id,
    details: { reason },
    req,
  });

  return formatSession(session);
};

module.exports = {
  IAM_PERMISSION_DEFINITIONS,
  ACTIVE_MEMBERSHIP_STATUSES,
  DEFAULT_LOGIN_METHODS,
  SESSION_STATUSES,
  addRolePermission,
  assertPermission,
  assertUserAccountActive,
  authorizeAccess,
  buildUserResponse,
  createMembership,
  createRole,
  createUser,
  deleteMembership,
  ensureIamAccount,
  ensureMembership,
  ensureRoleAssignment,
  formatMembership,
  formatPermission,
  formatRole,
  formatSession,
  formatTenant,
  getDefaultTenant,
  getRequestMeta,
  getUserWithIam,
  hasPermission,
  listAuditLogs,
  listMemberships,
  listPermissions,
  listRoles,
  listUsers,
  removeRolePermission,
  recordAuditLog,
  resolveActiveTenant,
  resolveAuthorizationContext,
  resolveRole,
  resolveTenantMemberships,
  revokeSession,
  updateMembership,
  updateRole,
  updateUser,
};
