-- Rollback: Lesson.objective field (021)
-- Lossy for `content`/`video_url`/`lesson_type` -- their data was dropped forward, not archived
-- (same tradeoff as prior migrations' down files in this module).

USE school_mgmt;

ALTER TABLE lessons
  ADD COLUMN content TEXT NULL AFTER lesson_summary,
  ADD COLUMN lesson_type ENUM('Standard','Microlearning','QuizOnly') NULL DEFAULT 'Standard' AFTER content,
  ADD COLUMN video_url VARCHAR(255) NULL AFTER lesson_type;

ALTER TABLE lessons DROP COLUMN objective;
