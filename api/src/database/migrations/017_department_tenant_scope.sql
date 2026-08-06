-- Migration 017: Make departments tenant-scoped
-- Departments used to be global reference data (single shared catalog, department_code
-- globally unique). Each tenant now owns its own department list: department_code is only
-- unique within a tenant, and every row carries created_by/updated_by/is_deleted like
-- courses already do. Pre-existing department rows (e.g. the seeded "GENERAL" department)
-- predate tenant-scoping and are backfilled onto the DEFAULT tenant so the existing
-- courses.department_id FK data stays valid.

USE school_mgmt;

-- 1. Add tenant_id (nullable first so the backfill below can run), created_by, updated_by,
--    is_deleted.
ALTER TABLE departments
  ADD COLUMN tenant_id INT UNSIGNED NULL AFTER id,
  ADD COLUMN created_by INT UNSIGNED NULL AFTER department_name,
  ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by,
  ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER updated_by;

-- 2. Backfill existing rows onto the DEFAULT tenant.
UPDATE departments
SET tenant_id = (SELECT id FROM tenants WHERE tenant_code = 'DEFAULT' LIMIT 1)
WHERE tenant_id IS NULL;

-- 3. Now that every row has a tenant, make it required.
ALTER TABLE departments
  MODIFY COLUMN tenant_id INT UNSIGNED NOT NULL;

-- 4. Drop the old global UNIQUE KEY on department_code (name looked up dynamically since it
--    was created via an inline "UNIQUE" column attribute, same pattern as migration 014).
SET @idx_name = (
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'departments'
    AND COLUMN_NAME = 'department_code'
  LIMIT 1
);
SET @sql = IF(@idx_name IS NOT NULL,
  CONCAT('ALTER TABLE departments DROP INDEX ', @idx_name),
  'SELECT "no department_code index found on departments"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. Replace it with a per-tenant composite uniqueness constraint.
ALTER TABLE departments
  ADD UNIQUE KEY departments_tenant_id_department_code (tenant_id, department_code);

-- 6. FKs: tenant_id cascades with its tenant; created_by/updated_by are SET NULL on user
--    deletion, matching courses.created_by / courses.updated_by.
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_departments_created_by FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_departments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
