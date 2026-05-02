-- Migration 006: Enrollment Module
-- Extends enrollments table and creates enrollment_histories, eligibility_results, payment_references tables

USE school_mgmt;

-- -------------------------------------------------------
-- 1. Extend enrollments table
-- -------------------------------------------------------

-- Change status enum to include all FSD values
-- First check if we need to migrate 'dropped' -> 'cancelled'
UPDATE enrollments SET status = 'cancelled' WHERE status = 'dropped';

-- Modify status column to new enum values
ALTER TABLE enrollments
  MODIFY COLUMN `status` ENUM('pending','active','suspended','cancelled','completed','rejected','waitlisted') NOT NULL DEFAULT 'pending';

-- Add request_source
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'request_source');
SET @s = IF(@e = 0, "ALTER TABLE enrollments ADD COLUMN request_source ENUM('student','parent','admin','system','import') NOT NULL DEFAULT 'student' AFTER `status`", 'SELECT "enr.request_source exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add payment_reference
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'payment_reference');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN payment_reference VARCHAR(100) NULL AFTER request_source', 'SELECT "enr.payment_reference exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add eligibility_result_id
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'eligibility_result_id');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN eligibility_result_id INT UNSIGNED NULL AFTER payment_reference', 'SELECT "enr.eligibility_result_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add requested_at
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'requested_at');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN requested_at DATETIME NULL AFTER eligibility_result_id', 'SELECT "enr.requested_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill requested_at from enrolled_at
UPDATE enrollments SET requested_at = enrolled_at WHERE requested_at IS NULL AND enrolled_at IS NOT NULL;
UPDATE enrollments SET requested_at = created_at WHERE requested_at IS NULL;

-- Add activated_at
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'activated_at');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN activated_at DATETIME NULL AFTER requested_at', 'SELECT "enr.activated_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill activated_at for existing active/completed enrollments
UPDATE enrollments SET activated_at = enrolled_at WHERE activated_at IS NULL AND status IN ('active','completed') AND enrolled_at IS NOT NULL;

-- Add cancelled_at
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'cancelled_at');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN cancelled_at DATETIME NULL AFTER activated_at', 'SELECT "enr.cancelled_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add created_by to enrollments
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'created_by');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN created_by INT UNSIGNED NULL AFTER cancelled_at', 'SELECT "enr.created_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill created_by from student_id for existing rows
UPDATE enrollments SET created_by = student_id WHERE created_by IS NULL;

-- Add updated_by to enrollments
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'enrollments' AND column_name = 'updated_by');
SET @s = IF(@e = 0, 'ALTER TABLE enrollments ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by', 'SELECT "enr.updated_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------
-- 2. Create enrollment_histories table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollment_histories (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  from_status   ENUM('pending','active','suspended','cancelled','completed','rejected','waitlisted') NULL,
  to_status     ENUM('pending','active','suspended','cancelled','completed','rejected','waitlisted') NOT NULL,
  reason_code   VARCHAR(100) NULL,
  reason_message TEXT NULL,
  source        ENUM('admin','user','system','billing_event','import') NOT NULL DEFAULT 'admin',
  source_reference VARCHAR(100) NULL,
  changed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by    INT UNSIGNED NULL,
  CONSTRAINT fk_enrhist_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrhist_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 3. Create eligibility_results table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS eligibility_results (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NULL,
  learner_id    INT UNSIGNED NOT NULL,
  course_id     INT UNSIGNED NOT NULL,
  result        ENUM('eligible','not_eligible','pending_condition') NOT NULL,
  reason_code   VARCHAR(100) NULL,
  reason_message TEXT NULL,
  checked_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_by    INT UNSIGNED NULL,
  CONSTRAINT fk_eligres_learner   FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eligres_course    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_eligres_checked_by FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 4. Create payment_references table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_references (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id            INT UNSIGNED NOT NULL,
  billing_reference        VARCHAR(100) NOT NULL,
  payment_condition_status ENUM('required','confirmed','failed','expired') NOT NULL DEFAULT 'required',
  confirmed_at             DATETIME NULL,
  event_id                 VARCHAR(100) NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payref_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 5. Backfill enrollment_histories for existing enrollments
--    (one initial record per existing enrollment to establish baseline)
-- -------------------------------------------------------
INSERT INTO enrollment_histories (enrollment_id, from_status, to_status, source, changed_at, changed_by)
SELECT id, NULL, status, 'system', COALESCE(enrolled_at, created_at), student_id
FROM enrollments
WHERE NOT EXISTS (
  SELECT 1 FROM enrollment_histories eh WHERE eh.enrollment_id = enrollments.id
);
