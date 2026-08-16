-- Migration 021: Lesson.objective field (FSD 7.2 alignment)
-- FSD 7.2 lists Lesson's core fields as: lesson_id, module_id, content_version_id, title,
-- objective, estimated_duration, order_no, status. Adds the missing `objective` column and
-- drops `content`/`video_url`/`lesson_type`, which predate CCA (leftover from an earlier
-- Assessment/Quiz-era lesson shape) and aren't part of the FSD's Lesson entity -- video content
-- is now represented via a LearningItem of item_type=Video instead (source=uploaded|external).

USE school_mgmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'objective');
SET @s = IF(@e = 0, 'ALTER TABLE lessons ADD COLUMN objective TEXT NULL AFTER title', 'SELECT "ls.objective exists"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill objective from the old `content` column where it held something (best-effort; content
-- was free text, not necessarily an objective statement, so this is a starting point for authors
-- to review/rewrite, not an authoritative migration of meaning).
SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'content');
SET @s = IF(@e > 0, 'UPDATE lessons SET objective = content WHERE objective IS NULL AND content IS NOT NULL', 'SELECT "ls.content already absent"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'content');
SET @s = IF(@e > 0, 'ALTER TABLE lessons DROP COLUMN content', 'SELECT "ls.content already absent"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'video_url');
SET @s = IF(@e > 0, 'ALTER TABLE lessons DROP COLUMN video_url', 'SELECT "ls.video_url already absent"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @e = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'school_mgmt' AND table_name = 'lessons' AND column_name = 'lesson_type');
SET @s = IF(@e > 0, 'ALTER TABLE lessons DROP COLUMN lesson_type', 'SELECT "ls.lesson_type already absent"');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
