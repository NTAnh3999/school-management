-- Migration: Add course core fields per FSD specification
-- Created: 2026-04-19
-- Description:
--   1. Add departments table
--   2. Add course_prerequisites table
--   3. Add audit_logs table
--   4. Alter courses table: add course_code, department_id, course_type, credit,
--      duration_hours, effective_from, effective_to, is_deleted, created_by, updated_by
--      and extend status enum to include 'inactive'

USE school_mgmt;

-- ============================================================
-- 1. Departments table
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(50) NOT NULL UNIQUE,
  department_name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. Alter courses table
-- ============================================================

-- 2a. Add course_code (unique)
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'course_code');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN course_code VARCHAR(50) NOT NULL DEFAULT "" AFTER id',
  'SELECT "course_code already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill course_code with a generated unique value to avoid duplicate constraint issues
UPDATE courses SET course_code = CONCAT('COURSE-', LPAD(id, 5, '0')) WHERE course_code = '';

-- Add unique constraint on course_code
SET @exist_uc = (SELECT COUNT(*) FROM information_schema.statistics
                 WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND index_name = 'uq_course_code');
SET @sql = IF(@exist_uc = 0,
  'ALTER TABLE courses ADD UNIQUE KEY uq_course_code (course_code)',
  'SELECT "uq_course_code already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2b. Add department_id (nullable FK, nullable to avoid breaking existing rows)
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'department_id');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN department_id INT UNSIGNED NULL AFTER course_code',
  'SELECT "department_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2c. Add course_type
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'course_type');
SET @sql = IF(@exist = 0,
  "ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) NOT NULL DEFAULT 'general' AFTER description",
  'SELECT "course_type already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2d. Add credit
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'credit');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN credit DECIMAL(5,2) NULL AFTER course_type',
  'SELECT "credit already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2e. Add duration_hours
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'duration_hours');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN duration_hours DECIMAL(6,2) NULL AFTER credit',
  'SELECT "duration_hours already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2f. Extend status ENUM to include 'inactive'
-- Note: MySQL requires redefining the full enum list
ALTER TABLE courses
  MODIFY COLUMN status ENUM('draft','active','inactive','archived') NOT NULL DEFAULT 'draft';

-- 2g. Add effective_from / effective_to
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'effective_from');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN effective_from DATE NULL AFTER status',
  'SELECT "effective_from already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'effective_to');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN effective_to DATE NULL AFTER effective_from',
  'SELECT "effective_to already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2h. Add is_deleted (soft delete flag)
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'is_deleted');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT "is_deleted already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2i. Add created_by / updated_by
SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'created_by');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN created_by INT UNSIGNED NULL',
  'SELECT "created_by already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'updated_by');
SET @sql = IF(@exist = 0,
  'ALTER TABLE courses ADD COLUMN updated_by INT UNSIGNED NULL',
  'SELECT "updated_by already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2j. Add FK for department_id
SET @exist_fk = (SELECT COUNT(*) FROM information_schema.table_constraints
                 WHERE constraint_schema = 'school_mgmt' AND table_name = 'courses' AND constraint_name = 'fk_courses_department');
SET @sql = IF(@exist_fk = 0,
  'ALTER TABLE courses ADD CONSTRAINT fk_courses_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
  'SELECT "fk_courses_department already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. Course prerequisites table
-- ============================================================
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  prerequisite_course_id INT UNSIGNED NOT NULL,
  prerequisite_type ENUM('ALL', 'ANY') NOT NULL DEFAULT 'ALL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_prereq_course_ref FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_course_prerequisite (course_id, prerequisite_course_id),
  CHECK (course_id <> prerequisite_course_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. Audit logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_name VARCHAR(100) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'CHANGE_STATUS', 'IMPORT', 'EXPORT') NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  changed_by INT UNSIGNED NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_name, entity_id),
  INDEX idx_changed_by (changed_by),
  CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 5. Seed a default department so existing data has reference
-- ============================================================
INSERT IGNORE INTO departments (department_code, department_name) VALUES ('GENERAL', 'General');
