const bcrypt = require("bcryptjs");
const { Role, User, Tenant, Permission, RolePermission, Branch, Campus } = require("../models");
const { ROLES } = require("../constants/roles");
const { IAM_PERMISSION_DEFINITIONS } = require("../constants/iam");
const {
  ensureIamAccount,
  ensureMembership,
  ensureRoleAssignment,
} = require("../services/iam.service");

const DEFAULT_ACCOUNTS = [
  {
    roleName: ROLES.ADMIN,
    email: process.env.ADMIN_EMAIL || "admin@schoolhub.io",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    fullName: "System Administrator",
  },
  {
    roleName: ROLES.TEACHER,
    email: process.env.TEACHER_EMAIL || "teacher@schoolhub.io",
    password: process.env.TEACHER_PASSWORD || "Teacher@123",
    fullName: "Lead Teacher",
  },
  {
    roleName: ROLES.STUDENT,
    email: process.env.STUDENT_EMAIL || "student@schoolhub.io",
    password: process.env.STUDENT_PASSWORD || "Student@123",
    fullName: "Demo Student",
  },
  {
    roleName: ROLES.PARENT,
    email: process.env.PARENT_EMAIL || "parent@schoolhub.io",
    password: process.env.PARENT_PASSWORD || "Parent@123",
    fullName: "Demo Parent",
  },
];

const ensureRoles = async () => {
  const names = DEFAULT_ACCOUNTS.map((account) => account.roleName);
  for (const name of names) {
    const existing = await Role.findOne({ where: { name } });
    if (!existing) {
      await Role.create({ name });
    }
  }
};

const ensureDefaultAccounts = async () => {
  for (const account of DEFAULT_ACCOUNTS) {
    const role = await Role.findOne({ where: { name: account.roleName } });
    if (!role) continue;

    const existing = await User.findOne({ where: { email: account.email } });
    if (existing) continue;

    const password_hash = await bcrypt.hash(account.password, 10);
    await User.create({
      email: account.email,
      password_hash,
      full_name: account.fullName,
    });
  }
};

const ensureDefaultTenant = async () => {
  const existing = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (!existing) {
    await Tenant.create({
      tenant_code: "DEFAULT",
      tenant_name: "Default School",
      status: "active",
    });
  }
};

const ensurePermissions = async () => {
  for (const definition of IAM_PERMISSION_DEFINITIONS) {
    const [permission] = await Permission.findOrCreate({
      where: { code: definition.code },
      defaults: definition,
    });

    if (
      permission.description !== definition.description ||
      permission.module !== definition.module ||
      permission.resource !== definition.resource ||
      permission.action !== definition.action
    ) {
      permission.description = definition.description;
      permission.module = definition.module;
      permission.resource = definition.resource;
      permission.action = definition.action;
      await permission.save();
    }
  }
};

const ensureDefaultRolePermissions = async () => {
  const adminRole = await Role.findOne({ where: { name: ROLES.ADMIN } });
  const teacherRole = await Role.findOne({ where: { name: ROLES.TEACHER } });
  const studentRole = await Role.findOne({ where: { name: ROLES.STUDENT } });
  const parentRole = await Role.findOne({ where: { name: ROLES.PARENT } });

  if (adminRole) {
    const permissions = await Permission.findAll();
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { role_id: adminRole.id, permission_id: permission.id },
        defaults: { role_id: adminRole.id, permission_id: permission.id },
      });
    }
  }

  if (teacherRole) {
    const teacherPermissionCodes = ["auth.tenant.switch"];
    const permissions = await Permission.findAll({ where: { code: teacherPermissionCodes } });
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { role_id: teacherRole.id, permission_id: permission.id },
        defaults: { role_id: teacherRole.id, permission_id: permission.id },
      });
    }
  }

  if (studentRole) {
    const permissions = await Permission.findAll({ where: { code: ["auth.tenant.switch"] } });
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { role_id: studentRole.id, permission_id: permission.id },
        defaults: { role_id: studentRole.id, permission_id: permission.id },
      });
    }
  }

  if (parentRole) {
    const permissions = await Permission.findAll({ where: { code: ["auth.tenant.switch"] } });
    for (const permission of permissions) {
      await RolePermission.findOrCreate({
        where: { role_id: parentRole.id, permission_id: permission.id },
        defaults: { role_id: parentRole.id, permission_id: permission.id },
      });
    }
  }
};

const ensureDefaultOrgStructure = async () => {
  const defaultTenant = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (!defaultTenant) return;

  const [branch] = await Branch.findOrCreate({
    where: { tenant_id: defaultTenant.id, branch_code: "MAIN" },
    defaults: {
      tenant_id: defaultTenant.id,
      branch_code: "MAIN",
      branch_name: "Main Branch",
    },
  });

  await Campus.findOrCreate({
    where: { branch_id: branch.id, campus_code: "MAIN" },
    defaults: {
      tenant_id: defaultTenant.id,
      branch_id: branch.id,
      campus_code: "MAIN",
      campus_name: "Main Campus",
    },
  });
};

const ensureDefaultIamIdentity = async () => {
  const defaultTenant = await Tenant.findOne({ where: { tenant_code: "DEFAULT" } });
  if (!defaultTenant) return;

  for (const account of DEFAULT_ACCOUNTS) {
    const user = await User.findOne({ where: { email: account.email } });
    if (!user) continue;

    const role = await Role.findOne({ where: { name: account.roleName } });
    if (!role) continue;

    await ensureIamAccount(user.id);
    await ensureMembership({ userId: user.id, tenantId: defaultTenant.id });
    await ensureRoleAssignment({
      userId: user.id,
      tenantId: defaultTenant.id,
      roleId: role.id,
    });
  }
};

const ensureSeedData = async () => {
  await ensureRoles();
  await ensureDefaultTenant();
  await ensureDefaultOrgStructure();
  await ensureDefaultAccounts();
  await ensurePermissions();
  await ensureDefaultRolePermissions();
  await ensureDefaultIamIdentity();
};

module.exports = { ensureRoles, ensureDefaultAccounts, ensureDefaultTenant, ensureSeedData };
