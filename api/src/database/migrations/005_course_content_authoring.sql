-- Migration 005: Course Content Authoring
-- Adds: status to sections/lessons, learning_items, content_assets, content_versions tables
-- Enhances: audit_logs with course_id, source, version_ref

USE school_mgmt;

-- -------------------------------------------------------
-- 1. Enhance course_sections (idempotent via PREPARE)
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'course_sections' AND column_name = 'status');
SET @s = IF(@e = 0, "ALTER TABLE course_sections ADD COLUMN `status` ENUM('draft','archived') NOT NULL DEFAULT 'draft' AFTER order_index", 'SELECT "cs.status exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'course_sections' AND column_name = 'created_by');
SET @s = IF(@e = 0, 'ALTER TABLE course_sections ADD COLUMN created_by INT UNSIGNED NULL AFTER `status`', 'SELECT "cs.created_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'course_sections' AND column_name = 'updated_by');
SET @s = IF(@e = 0, 'ALTER TABLE course_sections ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by', 'SELECT "cs.updated_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'course_sections' AND constraint_name = 'fk_sections_created_by');
SET @s = IF(@e = 0, 'ALTER TABLE course_sections ADD CONSTRAINT fk_sections_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'course_sections' AND constraint_name = 'fk_sections_updated_by');
SET @s = IF(@e = 0, 'ALTER TABLE course_sections ADD CONSTRAINT fk_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------
-- 2. Enhance lessons (idempotent via PREPARE)
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'status');
SET @s = IF(@e = 0, "ALTER TABLE lessons ADD COLUMN `status` ENUM('draft','archived') NOT NULL DEFAULT 'draft' AFTER order_index", 'SELECT "ls.status exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'estimated_duration');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN estimated_duration DECIMAL(6,2) NULL AFTER `status`', 'SELECT "ls.estimated_duration exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'created_by');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN created_by INT UNSIGNED NULL AFTER estimated_duration', 'SELECT "ls.created_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'updated_by');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by', 'SELECT "ls.updated_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'lessons' AND constraint_name = 'fk_lessons_created_by');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'lessons' AND constraint_name = 'fk_lessons_updated_by');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD CONSTRAINT fk_lessons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------
-- 3. Enhance audit_logs (idempotent via PREPARE)
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'audit_logs' AND column_name = 'course_id');
SET @s = IF(@e = 0, 'ALTER TABLE audit_logs ADD COLUMN course_id INT UNSIGNED NULL AFTER entity_id', 'SELECT "al.course_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'audit_logs' AND column_name = 'source');
SET @s = IF(@e = 0, 'ALTER TABLE audit_logs ADD COLUMN source VARCHAR(100) NULL AFTER course_id', 'SELECT "al.source exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'audit_logs' AND column_name = 'version_ref');
SET @s = IF(@e = 0, 'ALTER TABLE audit_logs ADD COLUMN version_ref INT UNSIGNED NULL AFTER source', 'SELECT "al.version_ref exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------
-- 4. Create content_assets table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL COMMENT 'video | image | document | audio',
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NULL,
  duration_seconds INT NULL,
  storage_key VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assets_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assets_uploaded_by (uploaded_by)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- 5. Create learning_items table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  item_type ENUM('VIDEO', 'QUIZ', 'INFOGRAPHIC', 'DOCUMENT', 'TEXT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_payload JSON NULL COMMENT 'Type-specific config: {video_url, quiz_id, body, etc.}',
  asset_id INT UNSIGNED NULL,
  display_order INT NOT NULL DEFAULT 0,
  estimated_duration DECIMAL(6,2) NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_asset FOREIGN KEY (asset_id) REFERENCES content_assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_items_lesson (lesson_id),
  INDEX idx_items_order (lesson_id, display_order)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- 6. Create content_versions table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  version_label VARCHAR(100) NOT NULL,
  version_no INT NOT NULL DEFAULT 1,
  status ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  changelog TEXT NULL,
  snapshot_ref JSON NULL COMMENT 'Frozen structure snapshot at publish time',
  published_at DATETIME NULL,
  published_by INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_versions_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_course_versions (course_id, status)
) ENGINE=InnoDB;
