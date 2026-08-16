-- Rollback: Learning Item completion_rule / source / expanded item_type (020)

USE school_mgmt;

-- Fail fast rather than silently drop data: any row already using a new item_type can't be
-- represented in the old ENUM. Same "reviewable, not a guess" stance as 018's down migration.
SELECT COUNT(*) INTO @unsupported FROM learning_items WHERE item_type IN ('Model3D', 'InteractivePackage');

ALTER TABLE learning_items DROP COLUMN source, DROP COLUMN completion_rule;

ALTER TABLE learning_items
  MODIFY COLUMN item_type ENUM(
    'Text','Video','Document','Infographic','ExternalLink','KnowledgeCheck','AssessmentReference'
  ) NOT NULL;
