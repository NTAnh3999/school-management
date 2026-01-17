const bcrypt = require("bcryptjs");
const { Role, User } = require("../models");

const DEFAULT_ACCOUNTS = [
  {
    roleName: "Admin",
    email: process.env.ADMIN_EMAIL || "admin@schoolhub.io",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    fullName: "System Administrator",
  },
  {
    roleName: "Teacher",
    email: process.env.TEACHER_EMAIL || "teacher@schoolhub.io",
    password: process.env.TEACHER_PASSWORD || "Teacher@123",
    fullName: "Lead Teacher",
  },
  {
    roleName: "Student",
    email: process.env.STUDENT_EMAIL || "student@schoolhub.io",
    password: process.env.STUDENT_PASSWORD || "Student@123",
    fullName: "Demo Student",
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
      role_id: role.id,
    });
  }
};

const ensureSeedData = async () => {
  await ensureRoles();
  await ensureDefaultAccounts();
};

module.exports = { ensureRoles, ensureDefaultAccounts, ensureSeedData };
