-- Migration: Update database schema to match new structure
-- Run this to migrate from old schema to new schema

USE school_mgmt;

-- Backup notification: Make sure to backup your database before running this migration!
-- Command: docker exec mysql18 mysqldump -uroot -p school_mgmt > backup_$(date +%Y%m%d_%H%M%S).sql

-- ==========================================
-- 1. Update courses table structure
-- ==========================================

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

-- ==========================================
-- 2. Verify and update users table if needed
-- ==========================================

-- Check if role_id column exists, if not add it
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

-- ==========================================
-- 3. Ensure all other tables match schema
-- ==========================================

-- Verify refresh_tokens table exists (should already be there)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id) 
) ENGINE=InnoDB;

-- ==========================================
-- 4. Seed default roles if missing
-- ==========================================

INSERT IGNORE INTO roles (name) VALUES ('admin'), ('instructor'), ('student');

-- ==========================================
-- Migration complete!
-- ==========================================
-- Next steps:
-- 1. Verify all tables: SHOW TABLES;
-- 2. Check courses structure: DESCRIBE courses;
-- 3. Update your application models if needed
