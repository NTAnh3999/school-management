-- Migration: Rename instructor role to teacher
-- Created: 2026-04-19
-- Description:
--   1. Rename role value 'instructor' to 'teacher' in roles table
--   2. Rename column courses.instructor_id → courses.teacher_id

USE school_mgmt;

-- ============================================================
-- 1. Rename role name in roles table
-- ============================================================
UPDATE roles SET name = 'teacher' WHERE name = 'instructor';

-- ============================================================
-- 2. Rename column instructor_id -> teacher_id in courses
-- ============================================================

-- Drop old FK constraint first
SET @exist_fk = (SELECT COUNT(*) FROM information_schema.table_constraints
                 WHERE constraint_schema = 'school_mgmt' AND table_name = 'courses'
                 AND constraint_name = 'fk_courses_instructor');
SET @sql = IF(@exist_fk > 0,
  'ALTER TABLE courses DROP FOREIGN KEY fk_courses_instructor',
  'SELECT "fk_courses_instructor does not exist"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rename column
SET @exist_col = (SELECT COUNT(*) FROM information_schema.columns
                  WHERE table_schema = 'school_mgmt' AND table_name = 'courses'
                  AND column_name = 'instructor_id');
SET @sql = IF(@exist_col > 0,
  'ALTER TABLE courses CHANGE COLUMN instructor_id teacher_id INT UNSIGNED NOT NULL',
  'SELECT "instructor_id does not exist, skip"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Re-add FK with new name
SET @exist_new_fk = (SELECT COUNT(*) FROM information_schema.table_constraints
                     WHERE constraint_schema = 'school_mgmt' AND table_name = 'courses'
                     AND constraint_name = 'fk_courses_teacher');
SET @sql = IF(@exist_new_fk = 0,
  'ALTER TABLE courses ADD CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "fk_courses_teacher already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
