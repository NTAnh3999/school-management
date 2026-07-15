-- ============================================================
-- Migration 012: Retire legacy users.role_id
-- Makes iam_role_assignments (tenant-scoped) the single source
-- of truth for a user's role. Assumes iam_memberships /
-- iam_role_assignments already exist (created by Sequelize sync
-- on app boot) — run the app at least once before this migration
-- on a brand new environment.
-- ============================================================

USE school_mgmt;

-- 1. Backfill: for every active membership that has no active role
--    assignment yet, seed one from the user's current (legacy) role_id.
INSERT INTO iam_role_assignments (user_id, tenant_id, role_id, scope_type, scope_ref_id, status, created_at, updated_at)
SELECT m.user_id, m.tenant_id, u.role_id, m.scope_type, m.scope_ref_id, 'active', NOW(), NOW()
FROM iam_memberships m
JOIN users u ON u.id = m.user_id
WHERE m.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM iam_role_assignments ra
    WHERE ra.user_id = m.user_id AND ra.tenant_id = m.tenant_id
      AND ra.scope_type = m.scope_type AND (ra.scope_ref_id <=> m.scope_ref_id)
      AND ra.status = 'active'
  );

-- 2. Safety net: users with a role_id but no membership at all
--    (e.g. manual DB edits) get attached to the DEFAULT tenant so
--    they aren't locked out of every role-gated route post-migration.
INSERT INTO iam_memberships (user_id, tenant_id, scope_type, scope_ref_id, status, created_at, updated_at)
SELECT u.id, t.id, 'tenant', NULL, 'active', NOW(), NOW()
FROM users u, (SELECT id FROM tenants WHERE tenant_code = 'DEFAULT' LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM iam_memberships m2 WHERE m2.user_id = u.id AND m2.status = 'active');

INSERT INTO iam_role_assignments (user_id, tenant_id, role_id, scope_type, scope_ref_id, status, created_at, updated_at)
SELECT u.id, t.id, u.role_id, 'tenant', NULL, 'active', NOW(), NOW()
FROM users u, (SELECT id FROM tenants WHERE tenant_code = 'DEFAULT' LIMIT 1) t
WHERE NOT EXISTS (SELECT 1 FROM iam_role_assignments ra WHERE ra.user_id = u.id AND ra.tenant_id = t.id AND ra.status = 'active');

-- 3. Drop the legacy FK + column. The FK's name varies across environments
--    (some got `fk_users_role` from schema.sql, others got the auto-generated
--    `users_ibfk_1` from earlier ad-hoc migrations) — look it up dynamically.
SET @fk_name = (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role_id' AND REFERENCED_TABLE_NAME = 'roles'
  LIMIT 1
);
SET @sql = IF(@fk_name IS NOT NULL,
  CONCAT('ALTER TABLE users DROP FOREIGN KEY ', @fk_name),
  'SELECT "no FK on users.role_id found"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE users DROP COLUMN role_id;
