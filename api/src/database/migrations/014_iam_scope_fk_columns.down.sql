USE school_mgmt;

-- iam_role_assignments: revert to scope_ref_id
ALTER TABLE iam_role_assignments DROP INDEX iam_role_assignments_unique_scope;
ALTER TABLE iam_role_assignments
  DROP FOREIGN KEY fk_iam_role_assignments_branch,
  DROP FOREIGN KEY fk_iam_role_assignments_campus,
  DROP FOREIGN KEY fk_iam_role_assignments_location,
  DROP COLUMN branch_id,
  DROP COLUMN campus_id,
  DROP COLUMN location_id,
  ADD COLUMN scope_ref_id VARCHAR(100) NULL AFTER scope_type;
ALTER TABLE iam_role_assignments
  ADD UNIQUE KEY iam_role_assignments_unique_scope (user_id, role_id, tenant_id, scope_type, scope_ref_id);

-- iam_memberships: revert to scope_ref_id
ALTER TABLE iam_memberships DROP INDEX iam_memberships_unique_scope;
ALTER TABLE iam_memberships
  DROP FOREIGN KEY fk_iam_memberships_branch,
  DROP FOREIGN KEY fk_iam_memberships_campus,
  DROP FOREIGN KEY fk_iam_memberships_location,
  DROP COLUMN branch_id,
  DROP COLUMN campus_id,
  DROP COLUMN location_id,
  ADD COLUMN scope_ref_id VARCHAR(100) NULL AFTER scope_type;
ALTER TABLE iam_memberships
  ADD UNIQUE KEY iam_memberships_user_id_tenant_id_scope_type_scope_ref_id (user_id, tenant_id, scope_type, scope_ref_id);
