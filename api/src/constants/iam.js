const ACCOUNT_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  LOCKED: "locked",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
});

const MEMBERSHIP_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  REVOKED: "revoked",
  EXPIRED: "expired",
});

const ROLE_ASSIGNMENT_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  REVOKED: "revoked",
});

const SESSION_STATUSES = Object.freeze({
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired",
});

const SCOPE_TYPES = Object.freeze({
  TENANT: "tenant",
  BRANCH: "branch",
  CAMPUS: "campus",
  LOCATION: "location",
});

const IAM_PERMISSION_DEFINITIONS = Object.freeze([
  {
    code: "iam.user.view",
    description: "View IAM user accounts",
    module: "iam",
    resource: "user",
    action: "view",
  },
  {
    code: "iam.user.manage",
    description: "Create and update IAM user accounts",
    module: "iam",
    resource: "user",
    action: "manage",
  },
  {
    code: "iam.membership.manage",
    description: "Assign or revoke tenant memberships",
    module: "iam",
    resource: "membership",
    action: "manage",
  },
  {
    code: "iam.role.view",
    description: "View IAM roles",
    module: "iam",
    resource: "role",
    action: "view",
  },
  {
    code: "iam.role.manage",
    description: "Create and update IAM roles",
    module: "iam",
    resource: "role",
    action: "manage",
  },
  {
    code: "iam.role.assign",
    description: "Assign or revoke roles for users",
    module: "iam",
    resource: "role",
    action: "assign",
  },
  {
    code: "iam.permission.view",
    description: "View IAM permissions",
    module: "iam",
    resource: "permission",
    action: "view",
  },
  {
    code: "iam.permission.manage",
    description: "Manage role-permission mappings",
    module: "iam",
    resource: "permission",
    action: "manage",
  },
  {
    code: "iam.audit.view",
    description: "View IAM audit logs",
    module: "iam",
    resource: "audit",
    action: "view",
  },
  {
    code: "iam.authorize",
    description: "Run IAM authorization decisions",
    module: "iam",
    resource: "authorize",
    action: "execute",
  },
  {
    code: "iam.session.revoke",
    description: "Revoke IAM sessions",
    module: "iam",
    resource: "session",
    action: "revoke",
  },
  {
    code: "auth.tenant.switch",
    description: "Switch active tenant context",
    module: "auth",
    resource: "tenant",
    action: "switch",
  },
  {
    code: "org.branch.view",
    description: "View branches",
    module: "org",
    resource: "branch",
    action: "view",
  },
  {
    code: "org.branch.manage",
    description: "Create and update branches",
    module: "org",
    resource: "branch",
    action: "manage",
  },
  {
    code: "org.campus.view",
    description: "View campuses",
    module: "org",
    resource: "campus",
    action: "view",
  },
  {
    code: "org.campus.manage",
    description: "Create and update campuses",
    module: "org",
    resource: "campus",
    action: "manage",
  },
  {
    code: "org.location.view",
    description: "View locations",
    module: "org",
    resource: "location",
    action: "view",
  },
  {
    code: "org.location.manage",
    description: "Create and update locations",
    module: "org",
    resource: "location",
    action: "manage",
  },
  {
    code: "academic.department.view",
    description: "View departments",
    module: "academic",
    resource: "department",
    action: "view",
  },
  {
    code: "academic.department.manage",
    description: "Create, update, and delete departments",
    module: "academic",
    resource: "department",
    action: "manage",
  },
  {
    code: "content.version.view",
    description: "View course content structure, versions, and drafts",
    module: "content",
    resource: "version",
    action: "view",
  },
  {
    code: "content.version.manage",
    description: "Create/edit content versions, modules, lessons, and learning items on assigned courses",
    module: "content",
    resource: "version",
    action: "manage",
  },
  {
    code: "content.version.manage.any",
    description: "Manage content versions on any course, bypassing the assigned-author check",
    module: "content",
    resource: "version",
    action: "manage_any",
  },
  {
    code: "content.review.decide",
    description: "Approve or request changes on a content version submitted for review",
    module: "content",
    resource: "review",
    action: "decide",
  },
  {
    code: "content.version.publish",
    description: "Publish or archive a content version",
    module: "content",
    resource: "version",
    action: "publish",
  },
  {
    code: "content.asset.manage",
    description: "Register and update content asset metadata",
    module: "content",
    resource: "asset",
    action: "manage",
  },
]);

module.exports = {
  ACCOUNT_STATUSES,
  MEMBERSHIP_STATUSES,
  ROLE_ASSIGNMENT_STATUSES,
  SESSION_STATUSES,
  SCOPE_TYPES,
  IAM_PERMISSION_DEFINITIONS,
};
