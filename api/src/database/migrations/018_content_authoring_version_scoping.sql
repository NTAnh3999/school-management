-- Migration 018: Course Content Authoring version-scoping (FSD alignment, part 1/2)
-- Adds the structural pieces needed for FSD "Course Content Authoring": a stable per-course
-- CourseContentRoot, the 6-state ContentVersion lifecycle (Draft/InReview/ChangesRequested/
-- Approved/Published/Archived), ContentReview decisions, a write-only content event outbox
-- (mirrors enrollment_event_outbox), a per-course CourseAuthor assignment table, and the new
-- content_version_id/revision columns on course_modules/lessons/learning_items.
--
-- Row-attachment of existing course_modules/lessons/learning_items to a content_version_id is
-- NOT done here -- it needs conditional branching (mint a synthetic v1 Draft vs. reuse an
-- existing open draft vs. clone from a Published snapshot) that is impractical as flat SQL.
-- That step lives in api/src/database/scripts/backfill-content-version-scoping.js, run once
-- after this migration. Only 019_content_version_scoping_not_null.sql (run after the backfill
-- script is verified complete) makes content_version_id NOT NULL + adds its FK/index.

USE school_mgmt;

-- -------------------------------------------------------
-- 1. course_content_roots
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_content_roots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NULL COMMENT 'Derived transitively via courses.department_id -> departments.tenant_id',
  course_id INT UNSIGNED NOT NULL,
  current_published_version_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_roots_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_roots_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  CONSTRAINT fk_content_roots_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_content_roots_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 2. content_reviews
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_version_id INT UNSIGNED NOT NULL,
  decided_by INT UNSIGNED NOT NULL,
  decision ENUM('APPROVED','CHANGES_REQUESTED') NOT NULL,
  comment TEXT NULL COMMENT 'Required at the service layer when decision = CHANGES_REQUESTED',
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_reviews_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_reviews_decided_by FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_content_reviews_version (content_version_id, decided_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 3. content_version_event_outbox (mirrors enrollment_event_outbox; write-only, no consumer)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_version_event_outbox (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(100) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  tenant_id INT UNSIGNED NULL,
  content_version_id INT UNSIGNED NULL,
  content_asset_id INT UNSIGNED NULL,
  course_id INT UNSIGNED NULL,
  previous_status VARCHAR(40) NULL,
  current_status VARCHAR(40) NOT NULL,
  payload JSON NULL,
  process_status ENUM('pending','processing','published','failed') NOT NULL DEFAULT 'pending',
  retry_count INT UNSIGNED NOT NULL DEFAULT 0,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cv_outbox_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_cv_outbox_asset FOREIGN KEY (content_asset_id) REFERENCES content_assets(id) ON DELETE CASCADE,
  CONSTRAINT fk_cv_outbox_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_cv_outbox_status (process_status, occurred_at),
  INDEX idx_cv_outbox_version (content_version_id, occurred_at),
  INDEX idx_cv_outbox_event_type (event_type, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 4. course_authors (per-course assigned Content Author, modeled on classroom_teachers)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_authors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role_in_course ENUM('primary_author','co_author') NOT NULL DEFAULT 'primary_author',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT UNSIGNED NULL,
  active_flag BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_authors_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_authors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_authors_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_course_authors_course_user (course_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 5. content_assets: tenant_id, processing_status, checksum (idempotent)
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_assets' AND column_name = 'tenant_id');
SET @s = IF(@e = 0, 'ALTER TABLE content_assets ADD COLUMN tenant_id INT UNSIGNED NULL AFTER id', 'SELECT "ca.tenant_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_assets' AND column_name = 'processing_status');
SET @s = IF(@e = 0, "ALTER TABLE content_assets ADD COLUMN processing_status ENUM('pending','processing','ready','failed') NOT NULL DEFAULT 'pending' AFTER thumbnail_url", 'SELECT "ca.processing_status exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_assets' AND column_name = 'checksum');
SET @s = IF(@e = 0, 'ALTER TABLE content_assets ADD COLUMN checksum VARCHAR(128) NULL AFTER processing_status', 'SELECT "ca.checksum exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'content_assets' AND constraint_name = 'fk_assets_tenant');
SET @s = IF(@e = 0, 'ALTER TABLE content_assets ADD CONSTRAINT fk_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Pre-migration assets were already usable in the old (no readiness gate) system -- only new
-- uploads made after this migration should default to 'pending' and require an explicit
-- readiness signal before they can gate publish-readiness.
UPDATE content_assets SET processing_status = 'ready' WHERE processing_status = 'pending';

-- -------------------------------------------------------
-- 6. content_versions: content_root_id, based_on_version_id, revision, approval/submission fields
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'content_root_id');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN content_root_id INT UNSIGNED NULL AFTER course_id', 'SELECT "cv.content_root_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'based_on_version_id');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN based_on_version_id INT UNSIGNED NULL AFTER content_root_id', 'SELECT "cv.based_on_version_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'revision');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1 AFTER status', 'SELECT "cv.revision exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'submitted_for_review_by');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN submitted_for_review_by INT UNSIGNED NULL AFTER snapshot_ref', 'SELECT "cv.submitted_for_review_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'submitted_for_review_at');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN submitted_for_review_at DATETIME NULL AFTER submitted_for_review_by', 'SELECT "cv.submitted_for_review_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'approved_by');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN approved_by INT UNSIGNED NULL AFTER submitted_for_review_at', 'SELECT "cv.approved_by exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'content_versions' AND column_name = 'approved_at');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD COLUMN approved_at DATETIME NULL AFTER approved_by', 'SELECT "cv.approved_at exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Redefine the status ENUM in-place: no row currently holds the old dead 'REVIEW' value (no
-- backend code path ever set it -- confirmed by reading content-version.service.js), so this is
-- safe without a value-mapping step.
ALTER TABLE content_versions
  MODIFY COLUMN status ENUM('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','ARCHIVED')
  NOT NULL DEFAULT 'DRAFT';

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'content_versions' AND constraint_name = 'fk_versions_content_root');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD CONSTRAINT fk_versions_content_root FOREIGN KEY (content_root_id) REFERENCES course_content_roots(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'content_versions' AND constraint_name = 'fk_versions_based_on');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD CONSTRAINT fk_versions_based_on FOREIGN KEY (based_on_version_id) REFERENCES content_versions(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'content_versions' AND constraint_name = 'fk_versions_submitted_by');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD CONSTRAINT fk_versions_submitted_by FOREIGN KEY (submitted_for_review_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'content_versions' AND constraint_name = 'fk_versions_approved_by');
SET @s = IF(@e = 0, 'ALTER TABLE content_versions ADD CONSTRAINT fk_versions_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------
-- 7. course_modules / lessons / learning_items: content_version_id (nullable for now) + revision
-- -------------------------------------------------------
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'course_modules' AND column_name = 'content_version_id');
SET @s = IF(@e = 0, 'ALTER TABLE course_modules ADD COLUMN content_version_id INT UNSIGNED NULL AFTER course_id', 'SELECT "cm.content_version_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'course_modules' AND column_name = 'revision');
SET @s = IF(@e = 0, 'ALTER TABLE course_modules ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1 AFTER status', 'SELECT "cm.revision exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'content_version_id');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN content_version_id INT UNSIGNED NULL AFTER module_id', 'SELECT "ls.content_version_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'revision');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1 AFTER status', 'SELECT "ls.revision exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND column_name = 'content_version_id');
SET @s = IF(@e = 0, 'ALTER TABLE learning_items ADD COLUMN content_version_id INT UNSIGNED NULL AFTER lesson_id', 'SELECT "li.content_version_id exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND column_name = 'revision');
SET @s = IF(@e = 0, 'ALTER TABLE learning_items ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1 AFTER status', 'SELECT "li.revision exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Expand learning_items.item_type to the FSD's casing/set (Text/Video/Document/Infographic/
-- ExternalLink/KnowledgeCheck/AssessmentReference), mapping the old all-caps values across.
ALTER TABLE learning_items
  MODIFY COLUMN item_type ENUM(
    'VIDEO','QUIZ','INFOGRAPHIC','DOCUMENT','TEXT',
    'Text','Video','Document','Infographic','ExternalLink','KnowledgeCheck','AssessmentReference'
  ) NOT NULL;

UPDATE learning_items SET item_type = 'Video' WHERE item_type = 'VIDEO';
UPDATE learning_items SET item_type = 'KnowledgeCheck' WHERE item_type = 'QUIZ';
UPDATE learning_items SET item_type = 'Infographic' WHERE item_type = 'INFOGRAPHIC';
UPDATE learning_items SET item_type = 'Document' WHERE item_type = 'DOCUMENT';
UPDATE learning_items SET item_type = 'Text' WHERE item_type = 'TEXT';

ALTER TABLE learning_items
  MODIFY COLUMN item_type ENUM(
    'Text','Video','Document','Infographic','ExternalLink','KnowledgeCheck','AssessmentReference'
  ) NOT NULL;

-- -------------------------------------------------------
-- 8. Backfill course_content_roots (one per existing course, tenant derived via department)
-- -------------------------------------------------------
INSERT INTO course_content_roots (tenant_id, course_id, current_published_version_id, created_at, updated_at)
SELECT
  d.tenant_id,
  c.id,
  (SELECT cv.id FROM content_versions cv WHERE cv.course_id = c.id AND cv.status = 'PUBLISHED' ORDER BY cv.published_at DESC LIMIT 1),
  NOW(),
  NOW()
FROM courses c
JOIN departments d ON d.id = c.department_id
WHERE NOT EXISTS (SELECT 1 FROM course_content_roots r WHERE r.course_id = c.id);

-- -------------------------------------------------------
-- 9. Backfill content_versions.content_root_id from the roots just created
-- -------------------------------------------------------
UPDATE content_versions cv
JOIN course_content_roots r ON r.course_id = cv.course_id
SET cv.content_root_id = r.id
WHERE cv.content_root_id IS NULL;
