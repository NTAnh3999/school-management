-- Migration 009: Rename course_sections → course_modules (align with CCA spec)
-- Also renames section_id → module_id in lessons table
-- and updates lesson title/description size to varchar(255)

-- Step 1: Drop FK from lessons → course_sections (to allow rename)
ALTER TABLE lessons
  DROP FOREIGN KEY fk_lessons_section;

-- Step 2: Rename the table
RENAME TABLE course_sections TO course_modules;

-- Step 3: Rename section_id → module_id in lessons
ALTER TABLE lessons
  CHANGE COLUMN section_id module_id INT UNSIGNED NOT NULL;

-- Step 4: Re-add FK with new name
ALTER TABLE lessons
  ADD CONSTRAINT fk_lessons_module
  FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;

-- Step 5: Widen title columns from 150 → 255 (matches spec varchar(255))
ALTER TABLE course_modules
  MODIFY COLUMN title VARCHAR(255) NOT NULL;

ALTER TABLE lessons
  MODIFY COLUMN title VARCHAR(255) NOT NULL;

-- Step 6: Add lesson_summary to lessons (spec §9.2 — brief description of lesson)
ALTER TABLE lessons
  ADD COLUMN lesson_summary TEXT NULL AFTER title;

-- Step 7: Rename order_index → display_order in course_modules (spec uses display_order)
ALTER TABLE course_modules
  CHANGE COLUMN order_index display_order INT NOT NULL DEFAULT 0;

-- Step 8: Rename order_index → display_order in lessons
ALTER TABLE lessons
  CHANGE COLUMN order_index display_order INT NOT NULL DEFAULT 0;
