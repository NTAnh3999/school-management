-- Rollback: Make departments tenant-scoped
-- This file rolls back the changes made in 017_department_tenant_scope.sql

USE school_mgmt;

ALTER TABLE departments
  DROP FOREIGN KEY fk_departments_tenant,
  DROP FOREIGN KEY fk_departments_created_by,
  DROP FOREIGN KEY fk_departments_updated_by;

ALTER TABLE departments
  DROP INDEX departments_tenant_id_department_code;

ALTER TABLE departments
  ADD UNIQUE KEY department_code (department_code);

ALTER TABLE departments
  DROP COLUMN tenant_id,
  DROP COLUMN created_by,
  DROP COLUMN updated_by,
  DROP COLUMN is_deleted;
