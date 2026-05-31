-- Migration 011: Progress FSD alignment
-- Makes progress explicitly course-version based, stores read-model snapshot data,
-- and adds progress event logs for recompute/update observability.

USE school_mgmt;

-- -------------------------------------------------------
-- 1. Extend student_course_progress
-- -------------------------------------------------------

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'course_version_id'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN course_version_id INT UNSIGNED NULL AFTER enrollment_id',
  'SELECT "scp.course_version_id exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'status'
);
SET @s = IF(
  @e = 0,
  "ALTER TABLE student_course_progress ADD COLUMN status ENUM('not_started','in_progress','completed','blocked','archived') NOT NULL DEFAULT 'not_started' AFTER course_version_id",
  'SELECT "scp.status exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'completed_item_count'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN completed_item_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER completion_percentage',
  'SELECT "scp.completed_item_count exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'total_item_count'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN total_item_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER completed_item_count',
  'SELECT "scp.total_item_count exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'progress_snapshot'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN progress_snapshot JSON NULL AFTER total_time_spent_minutes',
  'SELECT "scp.progress_snapshot exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'started_at'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN started_at DATETIME NULL AFTER progress_snapshot',
  'SELECT "scp.started_at exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'completed_at'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN completed_at DATETIME NULL AFTER started_at',
  'SELECT "scp.completed_at exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND column_name = 'last_computed_at'
);
SET @s = IF(
  @e = 0,
  'ALTER TABLE student_course_progress ADD COLUMN last_computed_at DATETIME NULL AFTER completed_at',
  'SELECT "scp.last_computed_at exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = 'school_mgmt'
    AND table_name = 'student_course_progress'
    AND constraint_name = 'fk_progress_course_version'
);
SET @s = IF(
  @fk_exists = 0,
  'ALTER TABLE student_course_progress ADD CONSTRAINT fk_progress_course_version FOREIGN KEY (course_version_id) REFERENCES content_versions(id) ON DELETE SET NULL',
  'SELECT "fk_progress_course_version exists"'
);
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE student_course_progress
SET status = CASE
  WHEN completion_percentage >= 100 THEN 'completed'
  WHEN completion_percentage > 0 OR total_time_spent_minutes > 0 THEN 'in_progress'
  ELSE 'not_started'
END
WHERE status IS NULL OR status = '';

UPDATE student_course_progress
SET completed_item_count = 0
WHERE completed_item_count IS NULL;

UPDATE student_course_progress
SET total_item_count = 0
WHERE total_item_count IS NULL;

UPDATE student_course_progress
SET last_computed_at = COALESCE(last_computed_at, updated_at)
WHERE last_computed_at IS NULL;

UPDATE student_course_progress
SET started_at = COALESCE(started_at, updated_at)
WHERE started_at IS NULL
  AND status IN ('in_progress', 'completed');

UPDATE student_course_progress
SET completed_at = COALESCE(completed_at, updated_at)
WHERE completed_at IS NULL
  AND status = 'completed';

UPDATE student_course_progress scp
JOIN enrollments e ON e.id = scp.enrollment_id
LEFT JOIN content_versions cv
  ON cv.course_id = e.course_id
 AND cv.status = 'PUBLISHED'
SET scp.course_version_id = cv.id
WHERE scp.course_version_id IS NULL;

-- -------------------------------------------------------
-- 2. Create progress_event_logs table
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS progress_event_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  progress_id INT UNSIGNED NULL,
  enrollment_id INT UNSIGNED NOT NULL,
  learner_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  course_version_id INT UNSIGNED NULL,
  source_module VARCHAR(100) NOT NULL,
  source_event_name VARCHAR(100) NOT NULL,
  source_event_id VARCHAR(120) NULL,
  process_status ENUM('received','success','failed','ignored') NOT NULL DEFAULT 'success',
  error_code VARCHAR(100) NULL,
  error_message TEXT NULL,
  metadata JSON NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_event_progress FOREIGN KEY (progress_id) REFERENCES student_course_progress(id) ON DELETE SET NULL,
  CONSTRAINT fk_progress_event_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_event_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_event_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_event_version FOREIGN KEY (course_version_id) REFERENCES content_versions(id) ON DELETE SET NULL,
  INDEX idx_progress_event_enrollment (enrollment_id, created_at),
  INDEX idx_progress_event_status (process_status, created_at),
  INDEX idx_progress_event_source (source_module, source_event_name, source_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
