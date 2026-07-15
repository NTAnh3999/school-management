-- Comprehensive schema for School Management System (MySQL)

-- Create database if missing and select it
CREATE DATABASE IF NOT EXISTS school_mgmt;
USE school_mgmt;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(50) NOT NULL UNIQUE,
  department_name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users table
-- Role is assigned per-tenant via iam_role_assignments (see migration 012), not a flat column here.
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(50) NOT NULL UNIQUE,
  department_id INT UNSIGNED NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100) NULL,
  description TEXT,
  course_type VARCHAR(50) NOT NULL DEFAULT 'general',
  credit DECIMAL(5, 2) NULL,
  duration_hours DECIMAL(6, 2) NULL,
  status ENUM('draft', 'active', 'inactive', 'archived') DEFAULT 'draft',
  effective_from DATE NULL,
  effective_to DATE NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_courses_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_courses_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Course prerequisites table
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  prerequisite_course_id INT UNSIGNED NOT NULL,
  prerequisite_type ENUM('ALL', 'ANY') NOT NULL DEFAULT 'ALL',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_prereq_course_ref FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_course_prerequisite (course_id, prerequisite_course_id)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_name VARCHAR(100) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NULL,
  source VARCHAR(100) NULL,
  version_ref INT UNSIGNED NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'CHANGE_STATUS', 'IMPORT', 'EXPORT') NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  changed_by INT UNSIGNED NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_name, entity_id),
  INDEX idx_changed_by (changed_by),
  CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Course modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_modules_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_modules_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  lesson_summary TEXT NULL,
  content TEXT,
  lesson_type ENUM('Standard', 'Microlearning', 'QuizOnly') DEFAULT 'Standard',
  video_url VARCHAR(255),
  duration_minutes INT DEFAULT 0,
  display_order INT DEFAULT 0,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  estimated_duration DECIMAL(6,2) NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
  CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_lessons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'active', 'suspended', 'cancelled', 'completed', 'rejected', 'waitlisted') NOT NULL DEFAULT 'pending',
  request_source ENUM('student', 'parent', 'admin', 'system', 'import') NOT NULL DEFAULT 'student',
  payment_reference VARCHAR(100) NULL,
  eligibility_result_id INT UNSIGNED NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  activated_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_enrollments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_enrollment (student_id, course_id)
) ENGINE=InnoDB;

-- Enrollment history table
CREATE TABLE IF NOT EXISTS enrollment_histories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  from_status ENUM('pending', 'active', 'suspended', 'cancelled', 'completed', 'rejected', 'waitlisted') NULL,
  to_status ENUM('pending', 'active', 'suspended', 'cancelled', 'completed', 'rejected', 'waitlisted') NOT NULL,
  reason_code VARCHAR(100) NULL,
  reason_message TEXT NULL,
  source ENUM('admin', 'user', 'system', 'billing_event', 'import') NOT NULL DEFAULT 'admin',
  source_reference VARCHAR(100) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by INT UNSIGNED NULL,
  CONSTRAINT fk_enrollment_histories_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_histories_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enrollment eligibility results
CREATE TABLE IF NOT EXISTS eligibility_results (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NULL,
  learner_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  result ENUM('eligible', 'not_eligible', 'pending_condition') NOT NULL,
  reason_code VARCHAR(100) NULL,
  reason_message TEXT NULL,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_by INT UNSIGNED NULL,
  CONSTRAINT fk_eligibility_results_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eligibility_results_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_eligibility_results_checked_by FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enrollment payment references
CREATE TABLE IF NOT EXISTS payment_references (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  billing_reference VARCHAR(100) NOT NULL,
  payment_condition_status ENUM('required', 'confirmed', 'failed', 'expired') NOT NULL DEFAULT 'required',
  confirmed_at DATETIME NULL,
  event_id VARCHAR(100) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_references_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  lesson_id INT UNSIGNED NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
  completion_date DATETIME,
  time_spent_minutes INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_lesson_progress (enrollment_id, lesson_id)
) ENGINE=InnoDB;

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  assessment_type ENUM('quiz', 'assignment', 'exam', 'survey', 'other') NOT NULL DEFAULT 'quiz',
  course_id INT UNSIGNED NULL,
  classroom_id INT UNSIGNED NULL,
  status ENUM('draft', 'published', 'closed', 'archived') NOT NULL DEFAULT 'draft',
  open_at DATETIME NULL,
  close_at DATETIME NULL,
  passing_score DECIMAL(5, 2) DEFAULT 70.00,
  time_limit_minutes INT,
  max_attempts INT DEFAULT 3,
  max_score DECIMAL(8, 2) NULL,
  grading_method ENUM('auto', 'manual', 'hybrid') NOT NULL DEFAULT 'auto',
  publish_policy ENUM('manual', 'auto_after_graded', 'scheduled') NOT NULL DEFAULT 'manual',
  result_publish_at DATETIME NULL,
  published_at DATETIME NULL,
  published_by INT UNSIGNED NULL,
  closed_at DATETIME NULL,
  closed_by INT UNSIGNED NULL,
  archived_at DATETIME NULL,
  archived_by INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('single_choice', 'multiple_choice', 'text', 'essay', 'file_upload') DEFAULT 'single_choice',
  points DECIMAL(5, 2) DEFAULT 1.00,
  order_index INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quiz question options table
CREATE TABLE IF NOT EXISTS quiz_options (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  quiz_id INT UNSIGNED NOT NULL,
  score DECIMAL(5, 2),
  status ENUM('not_started', 'in_progress', 'submitted', 'graded', 'published', 'expired') DEFAULT 'in_progress',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expired_at DATETIME NULL,
  submitted_at DATETIME,
  published_at DATETIME NULL,
  feedback TEXT,
  attempt_number INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quiz attempt answers table
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  selected_option_id INT UNSIGNED,
  text_answer TEXT,
  answer_payload JSON NULL,
  is_correct BOOLEAN,
  awarded_points DECIMAL(8, 2) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Assessment submissions table
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT UNSIGNED NOT NULL,
  submission_payload JSON NULL,
  submission_status ENUM('submitted', 'invalid') NOT NULL DEFAULT 'submitted',
  submitted_by INT UNSIGNED NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_submissions_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_submissions_user FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_submission_attempt (attempt_id)
) ENGINE=InnoDB;

-- Assessment grades table
CREATE TABLE IF NOT EXISTS assessment_grades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id INT UNSIGNED NOT NULL,
  score DECIMAL(8, 2) NULL,
  max_score DECIMAL(8, 2) NOT NULL,
  grading_status ENUM('draft', 'graded') NOT NULL DEFAULT 'draft',
  feedback TEXT NULL,
  grading_breakdown JSON NULL,
  graded_by INT UNSIGNED NULL,
  graded_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_grades_submission FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_grades_user FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_grade_submission (submission_id)
) ENGINE=InnoDB;

-- Assessment result publications table
CREATE TABLE IF NOT EXISTS assessment_result_publications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grade_id INT UNSIGNED NOT NULL,
  publication_status ENUM('not_published', 'published', 'unpublished') NOT NULL DEFAULT 'not_published',
  scheduled_publish_at DATETIME NULL,
  published_at DATETIME NULL,
  published_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_publications_grade FOREIGN KEY (grade_id) REFERENCES assessment_grades(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_publications_user FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_publication_grade (grade_id)
) ENGINE=InnoDB;

-- Assessment audit logs table
CREATE TABLE IF NOT EXISTS assessment_audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT UNSIGNED NULL,
  attempt_id INT UNSIGNED NULL,
  submission_id INT UNSIGNED NULL,
  grade_id INT UNSIGNED NULL,
  publication_id INT UNSIGNED NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  actor_user_id INT UNSIGNED NULL,
  actor_role VARCHAR(50) NULL,
  request_id VARCHAR(120) NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  reason TEXT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_audit_assessment FOREIGN KEY (assessment_id) REFERENCES quizzes(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_audit_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_audit_submission FOREIGN KEY (submission_id) REFERENCES assessment_submissions(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_audit_grade FOREIGN KEY (grade_id) REFERENCES assessment_grades(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_audit_publication FOREIGN KEY (publication_id) REFERENCES assessment_result_publications(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_assessment_audit_assessment (assessment_id, created_at),
  INDEX idx_assessment_audit_action (action)
) ENGINE=InnoDB;

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  reward_type ENUM('certificate', 'badge', 'points') DEFAULT 'badge',
  points_value INT DEFAULT 0,
  icon_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Student rewards table
CREATE TABLE IF NOT EXISTS student_course_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT UNSIGNED NOT NULL,
  course_version_id INT UNSIGNED NULL,
  status ENUM('not_started', 'in_progress', 'completed', 'blocked', 'archived') NOT NULL DEFAULT 'not_started',
  completion_percentage DECIMAL(5, 2) DEFAULT 0.00,
  completed_item_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_item_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_time_spent_minutes INT DEFAULT 0,
  progress_snapshot JSON NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  last_computed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_enrollment_id FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment_progress (enrollment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS progress_event_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  progress_id INT UNSIGNED NULL,
  enrollment_id INT UNSIGNED NOT NULL,
  learner_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  course_version_id INT UNSIGNED NULL,
  source_module VARCHAR(100) NOT NULL,
  source_event_name VARCHAR(100) NOT NULL,
  source_event_id VARCHAR(120) NULL,
  process_status ENUM('received', 'success', 'failed', 'ignored') NOT NULL DEFAULT 'success',
  error_code VARCHAR(100) NULL,
  error_message TEXT NULL,
  metadata JSON NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_event_progress FOREIGN KEY (progress_id) REFERENCES student_course_progress(id) ON DELETE SET NULL,
  CONSTRAINT fk_progress_event_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_event_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_event_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_progress_event_enrollment (enrollment_id, created_at),
  INDEX idx_progress_event_status (process_status, created_at)
) ENGINE=InnoDB;

-- Student rewards earned table
CREATE TABLE IF NOT EXISTS student_rewards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  reward_id INT UNSIGNED NOT NULL,
  enrollment_id INT UNSIGNED,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_rewards_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_rewards_reward FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_rewards_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Course reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (course_id, student_id)
) ENGINE=InnoDB;

-- Lesson feedback table
CREATE TABLE IF NOT EXISTS lesson_feedback (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  feedback_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedback_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  notification_type ENUM('progress', 'assignment', 'reward', 'course', 'general') DEFAULT 'general',
  title VARCHAR(150) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Content assets table (CCA-06)
CREATE TABLE IF NOT EXISTS content_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL COMMENT 'video | image | document | audio',
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NULL,
  duration_seconds INT NULL,
  storage_key VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assets_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assets_uploaded_by (uploaded_by)
) ENGINE=InnoDB;

-- Learning items table (CCA-05)
CREATE TABLE IF NOT EXISTS learning_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  item_type ENUM('VIDEO', 'QUIZ', 'INFOGRAPHIC', 'DOCUMENT', 'TEXT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_payload JSON NULL COMMENT 'Type-specific config: {video_url, quiz_id, body, etc.}',
  asset_id INT UNSIGNED NULL,
  display_order INT NOT NULL DEFAULT 0,
  estimated_duration DECIMAL(6,2) NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_asset FOREIGN KEY (asset_id) REFERENCES content_assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_items_lesson (lesson_id),
  INDEX idx_items_order (lesson_id, display_order)
) ENGINE=InnoDB;

-- Content versions table (CCA-08, CCA-09, CCA-10)
CREATE TABLE IF NOT EXISTS content_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  version_label VARCHAR(100) NOT NULL,
  version_no INT NOT NULL DEFAULT 1,
  status ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  changelog TEXT NULL,
  snapshot_ref JSON NULL COMMENT 'Frozen structure snapshot at publish time',
  published_at DATETIME NULL,
  published_by INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_versions_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_course_versions (course_id, status)
) ENGINE=InnoDB;

-- Seed default roles
INSERT IGNORE INTO roles (name) VALUES ('admin'), ('teacher'), ('student');

-- Seed default department
INSERT IGNORE INTO departments (department_code, department_name)
VALUES ('GENERAL', 'General');
