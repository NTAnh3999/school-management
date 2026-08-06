-- Migration 016: Enrollment event outbox
-- Stores Enrollment domain events for downstream modules to consume/retry.

USE school_mgmt;

CREATE TABLE IF NOT EXISTS enrollment_event_outbox (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(100) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  tenant_id INT UNSIGNED NULL,
  enrollment_id INT UNSIGNED NOT NULL,
  learner_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  classroom_id INT UNSIGNED NULL,
  previous_status VARCHAR(40) NULL,
  current_status VARCHAR(40) NOT NULL,
  payload JSON NULL,
  process_status ENUM('pending','processing','published','failed') NOT NULL DEFAULT 'pending',
  retry_count INT UNSIGNED NOT NULL DEFAULT 0,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_enr_outbox_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_outbox_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_outbox_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_enr_outbox_status (process_status, occurred_at),
  INDEX idx_enr_outbox_enrollment (enrollment_id, occurred_at),
  INDEX idx_enr_outbox_event_type (event_type, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
