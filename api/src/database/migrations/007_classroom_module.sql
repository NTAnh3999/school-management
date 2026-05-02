-- Migration 007: Classroom Module
-- Creates classrooms, classroom_teachers, classroom_sessions, classroom_enrollments tables

USE school_mgmt;

-- -------------------------------------------------------
-- 1. Create classrooms table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS classrooms (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classroom_code        VARCHAR(100) NOT NULL UNIQUE,
  classroom_name        VARCHAR(255) NOT NULL,
  description           TEXT NULL,
  course_id             INT UNSIGNED NOT NULL,
  course_version_id     INT UNSIGNED NULL,
  status                ENUM('draft','open','full','in_progress','completed','cancelled','archived') NOT NULL DEFAULT 'draft',
  delivery_method       ENUM('online','offline','hybrid') NOT NULL DEFAULT 'offline',
  campus_id             INT UNSIGNED NULL,
  location              VARCHAR(255) NULL,
  online_meeting_link   VARCHAR(500) NULL,
  academic_year         VARCHAR(20) NULL,
  term                  VARCHAR(100) NULL,
  language              VARCHAR(50) NULL,
  tags                  JSON NULL,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  enrollment_mode       ENUM('manual','self_enrollment','invitation_only') NOT NULL DEFAULT 'manual',
  enrollment_start_date DATE NULL,
  enrollment_end_date   DATE NULL,
  min_capacity          INT UNSIGNED NULL DEFAULT 0,
  max_capacity          INT UNSIGNED NOT NULL DEFAULT 30,
  enrolled_count        INT UNSIGNED NOT NULL DEFAULT 0,
  waitlist_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  approval_required     BOOLEAN NOT NULL DEFAULT FALSE,
  visibility            ENUM('public','private','internal') NOT NULL DEFAULT 'internal',
  cancelled_reason      TEXT NULL,
  is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
  created_by            INT UNSIGNED NULL,
  updated_by            INT UNSIGNED NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_classroom_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_classroom_course_version
    FOREIGN KEY (course_version_id) REFERENCES content_versions(id) ON DELETE SET NULL,
  CONSTRAINT fk_classroom_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_classroom_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_classroom_course (course_id),
  INDEX idx_classroom_status (status),
  INDEX idx_classroom_start_date (start_date)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- 2. Create classroom_teachers table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_teachers (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classroom_id         INT UNSIGNED NOT NULL,
  user_id              INT UNSIGNED NOT NULL,
  role_in_classroom    ENUM('main_teacher','co_teacher','teaching_assistant') NOT NULL DEFAULT 'main_teacher',
  assigned_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by          INT UNSIGNED NULL,
  active_flag          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cls_teacher_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_cls_teacher_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cls_teacher_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_classroom_teacher (classroom_id, user_id, role_in_classroom),
  INDEX idx_cls_teacher_classroom (classroom_id),
  INDEX idx_cls_teacher_user (user_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- 3. Create classroom_sessions table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_sessions (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classroom_id         INT UNSIGNED NOT NULL,
  session_no           INT UNSIGNED NOT NULL,
  session_title        VARCHAR(255) NULL,
  session_date         DATE NOT NULL,
  start_time           TIME NOT NULL,
  end_time             TIME NOT NULL,
  teacher_id           INT UNSIGNED NULL,
  location             VARCHAR(255) NULL,
  online_meeting_link  VARCHAR(500) NULL,
  status               ENUM('scheduled','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
  notes                TEXT NULL,
  original_date        DATE NULL,
  original_start_time  TIME NULL,
  original_end_time    TIME NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session_classroom (classroom_id),
  INDEX idx_session_date (session_date)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- 4. Create classroom_enrollments table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_enrollments (
  id                         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classroom_id               INT UNSIGNED NOT NULL,
  student_id                 INT UNSIGNED NOT NULL,
  enrollment_status          ENUM('pending_approval','enrolled','waitlisted','withdrawn','transferred','rejected','completed','failed') NOT NULL DEFAULT 'enrolled',
  enrollment_date            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source                     ENUM('manual','self_enrollment','import','api') NOT NULL DEFAULT 'manual',
  approved_by                INT UNSIGNED NULL,
  approved_at                DATETIME NULL,
  withdrawn_reason           TEXT NULL,
  transferred_to_classroom_id INT UNSIGNED NULL,
  completion_status          ENUM('not_started','in_progress','completed','not_completed') NOT NULL DEFAULT 'not_started',
  attendance_rate            DECIMAL(5,2) NULL DEFAULT 0.00,
  notes                      TEXT NULL,
  created_by                 INT UNSIGNED NULL,
  updated_by                 INT UNSIGNED NULL,
  created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cls_enr_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cls_enr_student
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cls_enr_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_cls_enr_transfer_dest
    FOREIGN KEY (transferred_to_classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_cls_enr_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_cls_student_active (classroom_id, student_id),
  INDEX idx_cls_enr_classroom (classroom_id),
  INDEX idx_cls_enr_student (student_id),
  INDEX idx_cls_enr_status (enrollment_status)
) ENGINE=InnoDB;
