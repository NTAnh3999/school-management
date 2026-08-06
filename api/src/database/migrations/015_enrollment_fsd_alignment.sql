-- Migration 015: Enrollment FSD alignment
-- Adds tenant/profile/classroom targeting, idempotency, reason, and version
-- metadata to the course-level enrollment table so Enrollment can be the
-- canonical source for both course-level and classroom-level lifecycle state.

USE school_mgmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'tenant_id');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN tenant_id INT UNSIGNED NULL AFTER id', 'SELECT "enr.tenant_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'learner_profile_id');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN learner_profile_id INT UNSIGNED NULL AFTER tenant_id', 'SELECT "enr.learner_profile_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'classroom_id');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN classroom_id INT UNSIGNED NULL AFTER course_id', 'SELECT "enr.classroom_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'enrollment_level');
SET @s = IF(@e = 0, "ALTER TABLE enrollments ADD COLUMN enrollment_level ENUM('course','classroom') NOT NULL DEFAULT 'course' AFTER classroom_id", 'SELECT "enr.enrollment_level exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'idempotency_key');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN idempotency_key VARCHAR(120) NULL AFTER request_source', 'SELECT "enr.idempotency_key exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'suspended_at');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN suspended_at DATETIME NULL AFTER activated_at', 'SELECT "enr.suspended_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'current_reason_code');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN current_reason_code VARCHAR(100) NULL AFTER cancelled_at', 'SELECT "enr.current_reason_code exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'current_reason_message');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN current_reason_message TEXT NULL AFTER current_reason_code', 'SELECT "enr.current_reason_message exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'version');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 0 AFTER current_reason_message', 'SELECT "enr.version exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE enrollments
SET enrollment_level = CASE WHEN classroom_id IS NULL THEN 'course' ELSE 'classroom' END
WHERE enrollment_level IS NULL OR enrollment_level = '';

SET @idx = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND index_name = 'idx_enrollments_scope_target');
SET @s = IF(@idx = 0, 'CREATE INDEX idx_enrollments_scope_target ON enrollments (tenant_id, student_id, course_id, classroom_id, status)', 'SELECT "idx_enrollments_scope_target exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND index_name = 'idx_enrollments_idempotency');
SET @s = IF(@idx = 0, 'CREATE INDEX idx_enrollments_idempotency ON enrollments (tenant_id, idempotency_key)', 'SELECT "idx_enrollments_idempotency exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND constraint_name = 'fk_enrollments_tenant');
SET @s = IF(@fk = 0, 'ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL', 'SELECT "fk_enrollments_tenant exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND constraint_name = 'fk_enrollments_learner_profile');
SET @s = IF(@fk = 0, 'ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_learner_profile FOREIGN KEY (learner_profile_id) REFERENCES profiles(id) ON DELETE SET NULL', 'SELECT "fk_enrollments_learner_profile exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND constraint_name = 'fk_enrollments_classroom');
SET @s = IF(@fk = 0, 'ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL', 'SELECT "fk_enrollments_classroom exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
