-- Migration 020: Learning Item completion_rule / source / expanded item_type (FSD §5.4 alignment)
-- Adds two new item_types (Model3D, InteractivePackage), and promotes `completion_rule` (one
-- fixed value per item_type per FSD 5.4's table) and `source` (Video-only: uploaded|external)
-- from ad hoc content_payload keys to first-class columns.

USE school_mgmt;

-- 1. Expand item_type ENUM (existing values first, so no in-flight row is ever briefly invalid).
ALTER TABLE learning_items
  MODIFY COLUMN item_type ENUM(
    'Text','Video','Document','Infographic','ExternalLink','KnowledgeCheck','AssessmentReference',
    'Model3D','InteractivePackage'
  ) NOT NULL;

-- 2. Add source and completion_rule columns (idempotent).
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND column_name = 'source');
SET @s = IF(@e = 0, "ALTER TABLE learning_items ADD COLUMN source ENUM('uploaded','external') NULL AFTER asset_id", 'SELECT "li.source exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND column_name = 'completion_rule');
SET @s = IF(@e = 0, "ALTER TABLE learning_items ADD COLUMN completion_rule ENUM('dwell_time','watch_percentage','opened','clicked','submitted','delegated','interacted','xapi_statement') NULL AFTER source", 'SELECT "li.completion_rule exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Backfill completion_rule for existing rows per FSD 5.4's fixed item_type -> rule mapping.
UPDATE learning_items SET completion_rule = 'dwell_time' WHERE item_type = 'Text' AND completion_rule IS NULL;
UPDATE learning_items SET completion_rule = 'watch_percentage' WHERE item_type = 'Video' AND completion_rule IS NULL;
UPDATE learning_items SET completion_rule = 'opened' WHERE item_type IN ('Document','Infographic') AND completion_rule IS NULL;
UPDATE learning_items SET completion_rule = 'clicked' WHERE item_type = 'ExternalLink' AND completion_rule IS NULL;
UPDATE learning_items SET completion_rule = 'submitted' WHERE item_type = 'KnowledgeCheck' AND completion_rule IS NULL;
UPDATE learning_items SET completion_rule = 'delegated' WHERE item_type = 'AssessmentReference' AND completion_rule IS NULL;

-- 4. Backfill source = 'uploaded' for existing Video rows that already reference a ContentAsset
--    (asset_id set); leave NULL for any Video row with no asset_id, since 'external' can't be
--    inferred retroactively without a stored url -- those need manual review, not a guess.
UPDATE learning_items SET source = 'uploaded' WHERE item_type = 'Video' AND asset_id IS NOT NULL AND source IS NULL;
