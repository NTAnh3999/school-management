-- ============================================================
-- Migration 011: Scheduling Module
-- Adds schedule_series, schedule_change_records, live_session_metadata
-- and enhances classroom_sessions for FSD-Scheduling alignment
-- ============================================================

-- 1. Schedule Series (recurring schedule groups)
CREATE TABLE IF NOT EXISTS schedule_series (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  classroom_id  INT UNSIGNED NOT NULL,
  recurrence_rule JSON NOT NULL COMMENT 'e.g. {type:"weekly", days:["mon","wed","fri"]}',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  teacher_id    INT UNSIGNED NULL,
  location      VARCHAR(255) NULL,
  delivery_mode ENUM('Offline','Online','Hybrid') NOT NULL DEFAULT 'Offline',
  is_deleted    TINYINT(1) NOT NULL DEFAULT 0,
  created_by    INT UNSIGNED NULL,
  updated_by    INT UNSIGNED NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_series_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_series_teacher   FOREIGN KEY (teacher_id)   REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_series_creator   FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_series_updater   FOREIGN KEY (updated_by)   REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_series_classroom (classroom_id),
  INDEX idx_series_teacher   (teacher_id)
) ENGINE=InnoDB;

-- 2. Schedule Change Records (audit trail for session mutations)
CREATE TABLE IF NOT EXISTS schedule_change_records (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id  INT UNSIGNED NOT NULL,
  series_id   INT UNSIGNED NULL,
  change_type VARCHAR(100) NOT NULL COMMENT 'time_change|location_change|teacher_change|cancel|reschedule|live_metadata|delivery_mode_change',
  old_values  JSON NULL,
  new_values  JSON NULL,
  reason      TEXT NULL,
  batch_id    VARCHAR(64) NULL COMMENT 'Groups multi-session reschedule operations',
  changed_by  INT UNSIGNED NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_change_session    FOREIGN KEY (session_id) REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_change_series     FOREIGN KEY (series_id)  REFERENCES schedule_series(id) ON DELETE SET NULL,
  CONSTRAINT fk_change_actor      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_change_session  (session_id),
  INDEX idx_change_series   (series_id),
  INDEX idx_change_batch    (batch_id)
) ENGINE=InnoDB;

-- 3. Live Session Metadata (online class room info)
CREATE TABLE IF NOT EXISTS live_session_metadata (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id      INT UNSIGNED NOT NULL UNIQUE,
  provider        VARCHAR(100) NULL COMMENT 'Zoom|GoogleMeet|Teams|Internal',
  room_id         VARCHAR(255) NULL,
  join_url        VARCHAR(2000) NULL,
  host_url        VARCHAR(2000) NULL,
  access_policy   JSON NULL,
  provider_status ENUM('Created','Pending','Failed') NOT NULL DEFAULT 'Pending',
  created_by      INT UNSIGNED NULL,
  updated_by      INT UNSIGNED NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_live_meta_session  FOREIGN KEY (session_id)  REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_live_meta_creator  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_live_meta_updater  FOREIGN KEY (updated_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Enhance classroom_sessions
ALTER TABLE classroom_sessions
  ADD COLUMN description   TEXT NULL          AFTER session_title,
  ADD COLUMN delivery_mode ENUM('Offline','Online','Hybrid') NOT NULL DEFAULT 'Offline' AFTER online_meeting_link,
  ADD COLUMN series_id     INT UNSIGNED NULL  AFTER delivery_mode,
  ADD COLUMN cancel_reason TEXT NULL          AFTER notes,
  ADD COLUMN campus_id     INT UNSIGNED NULL  AFTER cancel_reason,
  ADD COLUMN created_by    INT UNSIGNED NULL  AFTER campus_id,
  ADD COLUMN updated_by    INT UNSIGNED NULL  AFTER created_by,
  ADD CONSTRAINT fk_session_series  FOREIGN KEY (series_id)  REFERENCES schedule_series(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_session_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_session_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Extend status ENUM to include 'archived'
ALTER TABLE classroom_sessions
  MODIFY COLUMN status ENUM('scheduled','rescheduled','cancelled','completed','archived')
    NOT NULL DEFAULT 'scheduled';
