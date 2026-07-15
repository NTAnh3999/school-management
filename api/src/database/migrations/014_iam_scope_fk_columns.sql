-- ============================================================
-- Migration 014: Replace iam_memberships/iam_role_assignments'
-- polymorphic scope_ref_id (loose string, no FK) with explicit
-- branch_id/campus_id/location_id FK columns, so scope can be
-- validated and JOINed against real org-structure rows.
-- No backfill needed: every existing row is scope_type='tenant'
-- with scope_ref_id NULL, and NULL is exactly the right value
-- for all three new columns in that case.
-- ============================================================

USE school_mgmt;

-- ---------------------------------------------------------------
-- iam_memberships
-- ---------------------------------------------------------------
ALTER TABLE iam_memberships
  ADD COLUMN branch_id INT UNSIGNED NULL AFTER scope_type,
  ADD COLUMN campus_id INT UNSIGNED NULL AFTER branch_id,
  ADD COLUMN location_id INT UNSIGNED NULL AFTER campus_id,
  ADD CONSTRAINT fk_iam_memberships_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_iam_memberships_campus FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_iam_memberships_location FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop the old unique index covering scope_ref_id (name varies across
-- environments depending on how it was created — look it up dynamically,
-- same pattern used in migration 012 for the users.role_id FK name).
SET @idx_name = (
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'iam_memberships'
    AND COLUMN_NAME = 'scope_ref_id'
  LIMIT 1
);
SET @sql = IF(@idx_name IS NOT NULL,
  CONCAT('ALTER TABLE iam_memberships DROP INDEX ', @idx_name),
  'SELECT "no scope_ref_id index found on iam_memberships"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE iam_memberships DROP COLUMN scope_ref_id;

ALTER TABLE iam_memberships
  ADD UNIQUE KEY iam_memberships_unique_scope (user_id, tenant_id, scope_type, branch_id, campus_id, location_id);

-- ---------------------------------------------------------------
-- iam_role_assignments
-- ---------------------------------------------------------------
ALTER TABLE iam_role_assignments
  ADD COLUMN branch_id INT UNSIGNED NULL AFTER scope_type,
  ADD COLUMN campus_id INT UNSIGNED NULL AFTER branch_id,
  ADD COLUMN location_id INT UNSIGNED NULL AFTER campus_id,
  ADD CONSTRAINT fk_iam_role_assignments_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_iam_role_assignments_campus FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_iam_role_assignments_location FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

SET @idx_name2 = (
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'iam_role_assignments'
    AND COLUMN_NAME = 'scope_ref_id'
  LIMIT 1
);
SET @sql2 = IF(@idx_name2 IS NOT NULL,
  CONCAT('ALTER TABLE iam_role_assignments DROP INDEX ', @idx_name2),
  'SELECT "no scope_ref_id index found on iam_role_assignments"');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

ALTER TABLE iam_role_assignments DROP COLUMN scope_ref_id;

ALTER TABLE iam_role_assignments
  ADD UNIQUE KEY iam_role_assignments_unique_scope (user_id, role_id, tenant_id, scope_type, branch_id, campus_id, location_id);
