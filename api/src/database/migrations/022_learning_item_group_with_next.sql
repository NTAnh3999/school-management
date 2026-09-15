-- Migration 022: LearningItem.group_with_next (admin-portal Preview Content grouping)
-- Lets a Content Author mark that an item should render back-to-back with the *next* item (by
-- display_order) in the admin-only Lesson Preview (LessonPreviewContent /
-- LearningItemEditor.tsx) -- no heading, no gap, reading as one continuous flow. Preview-only
-- rendering hint: not part of content_payload, not consumed by completion tracking or publish
-- validation, and has no bearing on the not-yet-built learner-facing Learning Delivery surface
-- (FSD §2.2 -- CCA doesn't own that surface). Chains (item A groups into B, B groups into C)
-- fall out of the rendering logic for free; no group_id/table is introduced.

USE school_mgmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'learning_items' AND column_name = 'group_with_next');
SET @s = IF(@e = 0, 'ALTER TABLE learning_items ADD COLUMN group_with_next BOOLEAN NOT NULL DEFAULT FALSE AFTER is_required', 'SELECT "li.group_with_next exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
