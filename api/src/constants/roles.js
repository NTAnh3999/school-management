const ROLES = Object.freeze({
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
});

const ROLE_NAMES = Object.freeze(Object.values(ROLES));

const ROLE_LOOKUP_VALUES = Object.freeze({
  [ROLES.ADMIN]: Object.freeze([ROLES.ADMIN, "Admin", "ADMIN"]),
  [ROLES.INSTRUCTOR]: Object.freeze([
    ROLES.INSTRUCTOR,
    "Instructor",
    "INSTRUCTOR",
    "teacher",
    "Teacher",
    "TEACHER",
  ]),
  [ROLES.STUDENT]: Object.freeze([ROLES.STUDENT, "Student", "STUDENT"]),
});

const ROLE_ALIASES = Object.freeze(
  Object.entries(ROLE_LOOKUP_VALUES).reduce((acc, [role, aliases]) => {
    aliases.forEach((alias) => {
      acc[alias] = role;
    });
    return acc;
  }, {})
);

const STAFF_ROLES = Object.freeze([ROLES.ADMIN, ROLES.INSTRUCTOR]);

const normalizeRole = (role) => {
  if (typeof role !== "string") return null;

  const trimmedRole = role.trim();
  if (!trimmedRole) return null;

  return ROLE_ALIASES[trimmedRole] || ROLE_ALIASES[trimmedRole.toLowerCase()] || null;
};

const normalizeRoles = (roles = []) => [
  ...new Set(roles.map((role) => normalizeRole(role)).filter(Boolean)),
];

const isRole = (role, expectedRole) => {
  const normalizedRole = normalizeRole(role);
  const normalizedExpectedRole = normalizeRole(expectedRole);
  return Boolean(
    normalizedRole && normalizedExpectedRole && normalizedRole === normalizedExpectedRole
  );
};

const hasRole = (role, allowedRoles = []) => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  return normalizeRoles(allowedRoles).includes(normalizedRole);
};

const getRoleLookupValues = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_LOOKUP_VALUES[normalizedRole] || [] : [];
};

module.exports = {
  ROLES,
  ROLE_NAMES,
  STAFF_ROLES,
  getRoleLookupValues,
  hasRole,
  isRole,
  normalizeRole,
  normalizeRoles,
};
