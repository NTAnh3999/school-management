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
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
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
  department_id INT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  course_type VARCHAR(50) NOT NULL DEFAULT 'general',
  credit DECIMAL(5, 2) NULL,
  duration_hours DECIMAL(6, 2) NULL,
  level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  price DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('draft', 'active', 'inactive', 'archived') DEFAULT 'draft',
  effective_from DATE NULL,
  effective_to DATE NULL,
  teacher_id INT UNSIGNED NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
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

-- Course sections/modules table
CREATE TABLE IF NOT EXISTS course_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_sections_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT,
  lesson_type ENUM('video', 'text', 'quiz', 'assignment') DEFAULT 'text',
  video_url VARCHAR(255),
  duration_minutes INT DEFAULT 0,
  order_index INT DEFAULT 0,
  status ENUM('draft', 'archived') NOT NULL DEFAULT 'draft',
  estimated_duration DECIMAL(6,2) NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_section FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_lessons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, course_id)
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
  passing_score DECIMAL(5, 2) DEFAULT 70.00,
  time_limit_minutes INT,
  max_attempts INT DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('single_choice', 'multiple_choice', 'text') DEFAULT 'single_choice',
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
  status ENUM('in_progress', 'submitted', 'graded') DEFAULT 'in_progress',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
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
  is_correct BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id) ON DELETE SET NULL
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
  completion_percentage DECIMAL(5, 2) DEFAULT 0.00,
  total_time_spent_minutes INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_enrollment_id FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment_progress (enrollment_id)
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
