USE school_mgmt;

ALTER TABLE enrollments DROP FOREIGN KEY fk_enrollments_classroom;
ALTER TABLE enrollments DROP FOREIGN KEY fk_enrollments_learner_profile;
ALTER TABLE enrollments DROP FOREIGN KEY fk_enrollments_tenant;
DROP INDEX idx_enrollments_idempotency ON enrollments;
DROP INDEX idx_enrollments_scope_target ON enrollments;
ALTER TABLE enrollments DROP COLUMN version;
ALTER TABLE enrollments DROP COLUMN current_reason_message;
ALTER TABLE enrollments DROP COLUMN current_reason_code;
ALTER TABLE enrollments DROP COLUMN suspended_at;
ALTER TABLE enrollments DROP COLUMN idempotency_key;
ALTER TABLE enrollments DROP COLUMN enrollment_level;
ALTER TABLE enrollments DROP COLUMN classroom_id;
ALTER TABLE enrollments DROP COLUMN learner_profile_id;
ALTER TABLE enrollments DROP COLUMN tenant_id;
