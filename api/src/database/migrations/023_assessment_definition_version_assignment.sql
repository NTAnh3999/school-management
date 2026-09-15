-- Migration 023: Assessment Definition / Version / Assignment bridge
-- Adds FSD-aligned authoring entities while keeping the existing quiz-backed attempt and
-- submission flow intact. legacy_quiz_id lets the current APIs migrate incrementally.

USE school_mgmt;

CREATE TABLE IF NOT EXISTS assessment_definitions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  assessment_type ENUM('quiz', 'assignment', 'exam', 'survey', 'other') NOT NULL DEFAULT 'quiz',
  owner_scope_type ENUM('tenant', 'course', 'classroom') NOT NULL DEFAULT 'course',
  owner_scope_id INT UNSIGNED NULL,
  current_published_version_id INT UNSIGNED NULL,
  legacy_quiz_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_definitions_legacy_quiz FOREIGN KEY (legacy_quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_definitions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_definitions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_definitions_legacy_quiz (legacy_quiz_id),
  INDEX idx_assessment_definitions_scope (owner_scope_type, owner_scope_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assessment_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_definition_id INT UNSIGNED NOT NULL,
  legacy_quiz_id INT UNSIGNED NULL,
  version_no INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft', 'published', 'retired') NOT NULL DEFAULT 'draft',
  instructions TEXT NULL,
  max_score DECIMAL(8, 2) NULL,
  pass_threshold DECIMAL(5, 2) NULL,
  grading_method ENUM('auto', 'manual', 'hybrid') NOT NULL DEFAULT 'auto',
  question_snapshot JSON NULL,
  published_at DATETIME NULL,
  published_by INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_versions_definition FOREIGN KEY (assessment_definition_id) REFERENCES assessment_definitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_versions_legacy_quiz FOREIGN KEY (legacy_quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_versions_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_versions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_versions_definition_no (assessment_definition_id, version_no),
  UNIQUE KEY uq_assessment_versions_legacy_quiz (legacy_quiz_id),
  INDEX idx_assessment_versions_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assessment_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_version_id INT UNSIGNED NOT NULL,
  legacy_quiz_id INT UNSIGNED NULL,
  course_id INT UNSIGNED NULL,
  classroom_id INT UNSIGNED NULL,
  content_version_id INT UNSIGNED NULL,
  module_id INT UNSIGNED NULL,
  lesson_id INT UNSIGNED NULL,
  open_at DATETIME NULL,
  close_at DATETIME NULL,
  duration_minutes INT UNSIGNED NULL,
  attempt_limit INT UNSIGNED NOT NULL DEFAULT 1,
  selection_policy ENUM(
    'highest_released_score',
    'latest_released_attempt',
    'first_released_attempt',
    'average_released_score'
  ) NOT NULL DEFAULT 'highest_released_score',
  layout_mode ENUM('all_in_one_page', 'one_at_a_time') NOT NULL DEFAULT 'all_in_one_page',
  allow_question_review BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('draft', 'scheduled', 'open', 'closed', 'archived') NOT NULL DEFAULT 'draft',
  publish_policy ENUM('manual', 'auto_after_graded', 'scheduled') NOT NULL DEFAULT 'manual',
  result_publish_at DATETIME NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_assessment_assignments_version FOREIGN KEY (assessment_version_id) REFERENCES assessment_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_assignments_legacy_quiz FOREIGN KEY (legacy_quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_content_version FOREIGN KEY (content_version_id) REFERENCES content_versions(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_assignments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_assessment_assignments_legacy_quiz (legacy_quiz_id),
  INDEX idx_assessment_assignments_scope (course_id, classroom_id, lesson_id),
  INDEX idx_assessment_assignments_status_window (status, open_at, close_at)
) ENGINE=InnoDB;

INSERT INTO assessment_definitions (
  title,
  assessment_type,
  owner_scope_type,
  owner_scope_id,
  legacy_quiz_id,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  q.title,
  q.assessment_type,
  IF(q.classroom_id IS NULL, 'course', 'classroom'),
  COALESCE(q.classroom_id, q.course_id),
  q.id,
  q.created_by,
  q.updated_by,
  q.created_at,
  q.updated_at
FROM quizzes q
LEFT JOIN assessment_definitions d ON d.legacy_quiz_id = q.id
WHERE d.id IS NULL;

INSERT INTO assessment_versions (
  assessment_definition_id,
  legacy_quiz_id,
  version_no,
  status,
  instructions,
  max_score,
  pass_threshold,
  grading_method,
  question_snapshot,
  published_at,
  published_by,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  d.id,
  q.id,
  1,
  CASE
    WHEN q.status = 'draft' THEN 'draft'
    WHEN q.status = 'archived' THEN 'retired'
    ELSE 'published'
  END,
  q.description,
  q.max_score,
  q.passing_score,
  q.grading_method,
  JSON_OBJECT('source', 'quiz_questions', 'legacyQuizId', q.id),
  q.published_at,
  q.published_by,
  q.created_by,
  q.updated_by,
  q.created_at,
  q.updated_at
FROM quizzes q
JOIN assessment_definitions d ON d.legacy_quiz_id = q.id
LEFT JOIN assessment_versions v ON v.legacy_quiz_id = q.id
WHERE v.id IS NULL;

INSERT INTO assessment_assignments (
  assessment_version_id,
  legacy_quiz_id,
  course_id,
  classroom_id,
  content_version_id,
  module_id,
  lesson_id,
  open_at,
  close_at,
  duration_minutes,
  attempt_limit,
  status,
  publish_policy,
  result_publish_at,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  v.id,
  q.id,
  q.course_id,
  q.classroom_id,
  l.content_version_id,
  l.module_id,
  q.lesson_id,
  q.open_at,
  q.close_at,
  q.time_limit_minutes,
  GREATEST(COALESCE(q.max_attempts, 1), 1),
  CASE
    WHEN q.status = 'draft' THEN 'draft'
    WHEN q.status = 'closed' THEN 'closed'
    WHEN q.status = 'archived' THEN 'archived'
    WHEN q.open_at IS NOT NULL AND q.open_at > NOW() THEN 'scheduled'
    ELSE 'open'
  END,
  q.publish_policy,
  q.result_publish_at,
  q.created_by,
  q.updated_by,
  q.created_at,
  q.updated_at
FROM quizzes q
JOIN assessment_versions v ON v.legacy_quiz_id = q.id
LEFT JOIN lessons l ON l.id = q.lesson_id
LEFT JOIN assessment_assignments a ON a.legacy_quiz_id = q.id
WHERE a.id IS NULL;

UPDATE assessment_definitions d
JOIN assessment_versions v ON v.assessment_definition_id = d.id AND v.status = 'published'
SET d.current_published_version_id = v.id
WHERE d.current_published_version_id IS NULL;
