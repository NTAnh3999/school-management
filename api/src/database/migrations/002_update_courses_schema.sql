-- Migration: Update courses schema from old to new structure
-- Created: 2026-01-27
-- Description: Rename columns (name->title, teacher_id->instructor_id), add level/price/status columns

USE school_mgmt;

-- Check and drop old foreign key if it exists
SET @exist = (SELECT COUNT(*) FROM information_schema.table_constraints 
              WHERE constraint_schema = 'school_mgmt' 
              AND table_name = 'courses' 
              AND constraint_name = 'courses_ibfk_1');
SET @sqlstmt = IF(@exist > 0, 'ALTER TABLE courses DROP FOREIGN KEY courses_ibfk_1', 'SELECT "Foreign key does not exist"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

-- Rename and modify columns in separate statements for compatibility
ALTER TABLE courses CHANGE COLUMN name title VARCHAR(150) NOT NULL;
ALTER TABLE courses CHANGE COLUMN teacher_id instructor_id INT UNSIGNED NOT NULL;

-- Drop old columns if they exist
SET @exist_start = (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'start_date');
SET @sqlstmt_start = IF(@exist_start > 0, 'ALTER TABLE courses DROP COLUMN start_date', 'SELECT "Column start_date does not exist"');
PREPARE stmt FROM @sqlstmt_start;
EXECUTE stmt;

SET @exist_end = (SELECT COUNT(*) FROM information_schema.columns 
                  WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'end_date');
SET @sqlstmt_end = IF(@exist_end > 0, 'ALTER TABLE courses DROP COLUMN end_date', 'SELECT "Column end_date does not exist"');
PREPARE stmt FROM @sqlstmt_end;
EXECUTE stmt;

-- Add new columns if they don't exist
SET @exist_level = (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'level');
SET @sqlstmt_level = IF(@exist_level = 0, 
                        "ALTER TABLE courses ADD COLUMN level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner' AFTER description", 
                        'SELECT "Column level already exists"');
PREPARE stmt FROM @sqlstmt_level;
EXECUTE stmt;

SET @exist_price = (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'price');
SET @sqlstmt_price = IF(@exist_price = 0, 
                        'ALTER TABLE courses ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00 AFTER level', 
                        'SELECT "Column price already exists"');
PREPARE stmt FROM @sqlstmt_price;
EXECUTE stmt;

SET @exist_status = (SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_schema = 'school_mgmt' AND table_name = 'courses' AND column_name = 'status');
SET @sqlstmt_status = IF(@exist_status = 0, 
                         "ALTER TABLE courses ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft' AFTER price", 
                         'SELECT "Column status already exists"');
PREPARE stmt FROM @sqlstmt_status;
EXECUTE stmt;

-- Add new foreign key constraint
SET @exist_fk = (SELECT COUNT(*) FROM information_schema.table_constraints 
                 WHERE constraint_schema = 'school_mgmt' 
                 AND table_name = 'courses' 
                 AND constraint_name = 'fk_courses_instructor');
SET @sqlstmt_fk = IF(@exist_fk = 0, 
                     'ALTER TABLE courses ADD CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE', 
                     'SELECT "Foreign key fk_courses_instructor already exists"');
PREPARE stmt FROM @sqlstmt_fk;
EXECUTE stmt;

-- Check if role_id column exists in users table, if not add it
SET @exist_role = (SELECT COUNT(*) FROM information_schema.columns 
                   WHERE table_schema = 'school_mgmt' AND table_name = 'users' AND column_name = 'role_id');
SET @sqlstmt_role = IF(@exist_role = 0, 
                       'ALTER TABLE users ADD COLUMN role_id INT UNSIGNED NOT NULL DEFAULT 3 AFTER full_name', 
                       'SELECT "Column role_id already exists"');
PREPARE stmt FROM @sqlstmt_role;
EXECUTE stmt;

-- Add foreign key if not exists
SET @exist_user_fk = (SELECT COUNT(*) FROM information_schema.table_constraints 
                      WHERE constraint_schema = 'school_mgmt' 
                      AND table_name = 'users' 
                      AND constraint_name = 'fk_users_role');
SET @sqlstmt_user_fk = IF(@exist_user_fk = 0, 
                          'ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)', 
                          'SELECT "Foreign key fk_users_role already exists"');
PREPARE stmt FROM @sqlstmt_user_fk;
EXECUTE stmt;
