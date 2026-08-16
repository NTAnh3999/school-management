-- Rollback: Course Content Authoring version-scoping NOT NULL/FK/index (019)

USE school_mgmt;

ALTER TABLE course_modules DROP INDEX idx_modules_version_order;
ALTER TABLE lessons DROP INDEX idx_lessons_version_order;
ALTER TABLE learning_items DROP INDEX idx_items_version_order;

ALTER TABLE course_modules DROP FOREIGN KEY fk_modules_content_version;
ALTER TABLE lessons DROP FOREIGN KEY fk_lessons_content_version;
ALTER TABLE learning_items DROP FOREIGN KEY fk_items_content_version;

ALTER TABLE course_modules MODIFY COLUMN content_version_id INT UNSIGNED NULL;
ALTER TABLE lessons MODIFY COLUMN content_version_id INT UNSIGNED NULL;
ALTER TABLE learning_items MODIFY COLUMN content_version_id INT UNSIGNED NULL;
