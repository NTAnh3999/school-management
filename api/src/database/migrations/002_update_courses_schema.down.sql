-- Rollback: Update courses schema
-- This file rolls back the changes made in 002_update_courses_schema.sql
-- WARNING: This will drop columns and data may be lost!

USE school_mgmt;

-- Drop new foreign key
ALTER TABLE courses DROP FOREIGN KEY IF EXISTS fk_courses_instructor;

-- Rename columns back
ALTER TABLE courses CHANGE COLUMN title name VARCHAR(150) NOT NULL;
ALTER TABLE courses CHANGE COLUMN instructor_id teacher_id INT UNSIGNED NOT NULL;

-- Drop new columns
ALTER TABLE courses DROP COLUMN IF EXISTS level;
ALTER TABLE courses DROP COLUMN IF EXISTS price;
ALTER TABLE courses DROP COLUMN IF EXISTS status;

-- Add back old columns
ALTER TABLE courses 
  ADD COLUMN start_date DATE AFTER description,
  ADD COLUMN end_date DATE AFTER start_date;

-- Re-add old foreign key
ALTER TABLE courses 
  ADD CONSTRAINT courses_ibfk_1 
  FOREIGN KEY (teacher_id) REFERENCES users(id);
