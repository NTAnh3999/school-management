-- Migration 019: Course Content Authoring version-scoping (FSD alignment, part 2/2)
-- Run only after 018_content_authoring_version_scoping.sql AND
-- api/src/database/scripts/backfill-content-version-scoping.js have both completed and the
-- backfill script's own "remaining unattached rows" check reported 0. Deliberately split from
-- 018 so a partial backfill can never leave the DB in a broken half-migrated state -- flipping
-- content_version_id to NOT NULL is a separate, reviewable step.

USE school_mgmt;

-- Drop any pre-existing FK on content_version_id first, whatever its name: a schema bootstrapped
-- via Sequelize's sync() (this repo's actual dev-DB bootstrap path per its own convention, not
-- migrate:up) auto-generates an FK with an auto-assigned name (e.g. `..._ibfk_12`) with
-- ON DELETE SET NULL the moment the model's content_version_id column exists with allowNull:true
-- -- and MySQL refuses NOT NULL on a column still covered by a SET NULL FK. Re-added below with
-- the intended name/ON DELETE CASCADE regardless of which path created the column.
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'course_modules' AND COLUMN_NAME = 'content_version_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @s = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE course_modules DROP FOREIGN KEY ', @fk), 'SELECT "no fk to drop"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'lessons' AND COLUMN_NAME = 'content_version_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @s = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE lessons DROP FOREIGN KEY ', @fk), 'SELECT "no fk to drop"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'school_mgmt' AND TABLE_NAME = 'learning_items' AND COLUMN_NAME = 'content_version_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1);
SET @s = IF(@fk IS NOT NULL, CONCAT('ALTER TABLE learning_items DROP FOREIGN KEY ', @fk), 'SELECT "no fk to drop"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE course_modules
  MODIFY COLUMN content_version_id INT UNSIGNED NOT NULL;

ALTER TABLE lessons
  MODIFY COLUMN content_version_id INT UNSIGNED NOT NULL;

ALTER TABLE learning_items
  MODIFY COLUMN content_version_id INT UNSIGNED NOT NULL;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'course_modules' AND constraint_name = 'fk_modules_content_version');
SET @s = IF(@e = 0, 'ALTER TABLE course_modules ADD CONSTRAINT fk_modules_content_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE CASCADE', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'lessons' AND constraint_name = 'fk_lessons_content_version');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD CONSTRAINT fk_lessons_content_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE CASCADE', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'school_mgmt' AND table_name = 'learning_items' AND constraint_name = 'fk_items_content_version');
SET @s = IF(@e = 0, 'ALTER TABLE learning_items ADD CONSTRAINT fk_items_content_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE CASCADE', 'SELECT "fk exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'school_mgmt' AND table_name = 'course_modules' AND index_name = 'idx_modules_version_order');
SET @s = IF(@e = 0, 'ALTER TABLE course_modules ADD INDEX idx_modules_version_order (content_version_id, display_order)', 'SELECT "index exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND index_name = 'idx_lessons_version_order');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD INDEX idx_lessons_version_order (content_version_id, display_order)', 'SELECT "index exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND index_name = 'idx_items_version_order');
SET @s = IF(@e = 0, 'ALTER TABLE learning_items ADD INDEX idx_items_version_order (content_version_id, display_order)', 'SELECT "index exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
