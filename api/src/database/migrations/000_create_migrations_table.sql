-- Migration: Create migrations tracking table
-- This table tracks which migrations have been applied
-- Run this FIRST before using the migration system

USE school_mgmt;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT,
  checksum VARCHAR(64),
  INDEX idx_migration_name (migration_name),
  INDEX idx_applied_at (applied_at)
) ENGINE=InnoDB;

-- Insert this migration as the first entry
INSERT IGNORE INTO schema_migrations (migration_name, execution_time_ms) 
VALUES ('000_create_migrations_table', 0);
