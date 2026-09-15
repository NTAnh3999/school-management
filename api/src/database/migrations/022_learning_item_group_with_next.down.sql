-- Rollback: LearningItem.group_with_next (022)
-- Plain boolean flag with no prior representation to preserve and no ENUM-value-in-use hazard
-- (unlike 020's down migration, which fails fast on rows using a new item_type ENUM value that
-- the old ENUM can't represent) -- a boolean column can only ever hold true/false/default, so
-- dropping it is lossy only in the trivial "the flag itself is gone" sense, not in the
-- "some row can no longer be represented at all" sense. No guard needed.

USE school_mgmt;

ALTER TABLE learning_items DROP COLUMN group_with_next;
