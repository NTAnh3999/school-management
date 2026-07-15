-- ============================================================
-- Rollback for Migration 012: restore users.role_id
-- Best-effort: backfills from the user's current active
-- iam_role_assignments; defaults to 'student' if none found.
-- ============================================================

USE school_mgmt;

ALTER TABLE users ADD COLUMN role_id INT UNSIGNED NULL AFTER full_name;

UPDATE users u
SET role_id = (
  SELECT ra.role_id FROM iam_role_assignments ra
  WHERE ra.user_id = u.id AND ra.status = 'active'
  ORDER BY ra.tenant_id ASC LIMIT 1
);

UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'student' LIMIT 1) WHERE role_id IS NULL;

ALTER TABLE users MODIFY COLUMN role_id INT UNSIGNED NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id);
