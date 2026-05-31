-- Migration 010: FSD-Course spec alignment
-- 1. Rename title → course_name, widen to varchar(255)
-- 2. Add short_name varchar(100) (optional)
-- 3. Make department_id mandatory
-- 4. Drop teacher_id, level, price (not in FSD spec data dictionary)

-- Step 1: Rename title → course_name
ALTER TABLE courses
  CHANGE COLUMN title course_name VARCHAR(255) NOT NULL;

-- Step 2: Add short_name after course_name
ALTER TABLE courses
  ADD COLUMN short_name VARCHAR(100) NULL AFTER course_name;

-- Step 3: Make department_id NOT NULL
--   (Ensure all existing rows have a valid department_id before running!)
ALTER TABLE courses
  MODIFY COLUMN department_id INT UNSIGNED NOT NULL;

-- Step 4: Drop columns not in spec
ALTER TABLE courses
  DROP COLUMN teacher_id,
  DROP COLUMN level,
  DROP COLUMN price;
