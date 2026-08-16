-- Rollback: Course Content Authoring version-scoping (018)
-- Lossy: drops the synthetic-version/root backfill data created by 018's steps 8-9 and by
-- the standalone backfill-content-version-scoping.js script (same tradeoff as
-- 016_enrollment_event_outbox.down.sql, which doesn't try to preserve outbox rows either).

USE school_mgmt;

-- Revert learning_items.item_type back to the original all-caps set (data mapped back).
UPDATE learning_items SET item_type = 'VIDEO' WHERE item_type = 'Video';
UPDATE learning_items SET item_type = 'QUIZ' WHERE item_type = 'KnowledgeCheck';
UPDATE learning_items SET item_type = 'INFOGRAPHIC' WHERE item_type = 'Infographic';
UPDATE learning_items SET item_type = 'DOCUMENT' WHERE item_type = 'Document';
UPDATE learning_items SET item_type = 'TEXT' WHERE item_type = 'Text';
-- ExternalLink / AssessmentReference have no pre-migration equivalent; fall back to TEXT.
UPDATE learning_items SET item_type = 'TEXT' WHERE item_type IN ('ExternalLink', 'AssessmentReference');

ALTER TABLE learning_items
  MODIFY COLUMN item_type ENUM('VIDEO', 'QUIZ', 'INFOGRAPHIC', 'DOCUMENT', 'TEXT') NOT NULL;

ALTER TABLE learning_items DROP COLUMN content_version_id, DROP COLUMN revision;
ALTER TABLE lessons DROP COLUMN content_version_id, DROP COLUMN revision;
ALTER TABLE course_modules DROP COLUMN content_version_id, DROP COLUMN revision;

ALTER TABLE content_versions
  DROP FOREIGN KEY fk_versions_content_root,
  DROP FOREIGN KEY fk_versions_based_on,
  DROP FOREIGN KEY fk_versions_submitted_by,
  DROP FOREIGN KEY fk_versions_approved_by;

ALTER TABLE content_versions
  MODIFY COLUMN status ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

ALTER TABLE content_versions
  DROP COLUMN content_root_id,
  DROP COLUMN based_on_version_id,
  DROP COLUMN revision,
  DROP COLUMN submitted_for_review_by,
  DROP COLUMN submitted_for_review_at,
  DROP COLUMN approved_by,
  DROP COLUMN approved_at;

ALTER TABLE content_assets
  DROP FOREIGN KEY fk_assets_tenant;

ALTER TABLE content_assets
  DROP COLUMN tenant_id,
  DROP COLUMN processing_status,
  DROP COLUMN checksum;

DROP TABLE IF EXISTS course_authors;
DROP TABLE IF EXISTS content_version_event_outbox;
DROP TABLE IF EXISTS content_reviews;
DROP TABLE IF EXISTS course_content_roots;
