-- Migration 008: Profile Module
-- Adds tables: tenants, profiles, student_profiles, parent_profiles,
-- teacher_profiles, parent_student_relationships
-- Also extends audit_logs action enum and seeds default tenant + parent role.

-- -------------------------------------------------------------------------
-- Tenants
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_code VARCHAR(50) NOT NULL UNIQUE,
  tenant_name VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenants_status (status)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Profiles  (business profile data, separate from IAM users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  profile_type ENUM('student', 'parent', 'teacher', 'staff', 'admin') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  display_name VARCHAR(120) NULL,
  avatar_url VARCHAR(500) NULL,
  contact_email VARCHAR(120) NULL,
  phone_number VARCHAR(30) NULL,
  address TEXT NULL,
  status ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft',
  visibility ENUM('internal', 'public', 'private') NOT NULL DEFAULT 'internal',
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_profiles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_profiles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_profiles_tenant (tenant_id),
  INDEX idx_profiles_user (user_id),
  INDEX idx_profiles_type (profile_type),
  INDEX idx_profiles_status (status)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Student Profiles  (one-to-one extension of profiles)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id INT UNSIGNED NOT NULL UNIQUE,
  student_code VARCHAR(50) NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other', 'unspecified') NULL,
  current_level VARCHAR(100) NULL,
  learning_goal TEXT NULL,
  student_status ENUM('active', 'inactive', 'graduated', 'suspended') NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_student_code (student_code)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Parent Profiles  (one-to-one extension of profiles)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id INT UNSIGNED NOT NULL UNIQUE,
  parent_code VARCHAR(50) NULL,
  occupation VARCHAR(150) NULL,
  contact_priority INT NOT NULL DEFAULT 1,
  emergency_contact_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_parent_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_parent_code (parent_code)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Teacher Profiles  (one-to-one extension of profiles)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id INT UNSIGNED NOT NULL UNIQUE,
  teacher_code VARCHAR(50) NULL,
  bio TEXT NULL,
  expertise JSON NULL,
  qualification TEXT NULL,
  years_of_experience INT NOT NULL DEFAULT 0,
  public_profile_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teacher_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_teacher_code (teacher_code)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Parent–Student Relationships
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  parent_profile_id INT UNSIGNED NOT NULL,
  student_profile_id INT UNSIGNED NOT NULL,
  relationship_type ENUM('father', 'mother', 'guardian', 'other') NOT NULL DEFAULT 'guardian',
  status ENUM('pending', 'active', 'suspended', 'revoked') NOT NULL DEFAULT 'pending',
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  reason TEXT NULL,
  created_by INT UNSIGNED NULL,
  updated_by INT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_psr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_psr_parent FOREIGN KEY (parent_profile_id) REFERENCES parent_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_psr_student FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_psr_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_psr_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_psr_parent (parent_profile_id),
  INDEX idx_psr_student (student_profile_id),
  INDEX idx_psr_status (status),
  INDEX idx_psr_tenant (tenant_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- Extend audit_logs action enum to include LINK / UNLINK
-- -------------------------------------------------------------------------
ALTER TABLE audit_logs
  MODIFY COLUMN action ENUM(
    'CREATE', 'UPDATE', 'DELETE', 'CHANGE_STATUS', 'IMPORT', 'EXPORT', 'LINK', 'UNLINK'
  ) NOT NULL;

-- -------------------------------------------------------------------------
-- Seed default tenant
-- -------------------------------------------------------------------------
INSERT IGNORE INTO tenants (tenant_code, tenant_name) VALUES ('DEFAULT', 'Default School');

-- -------------------------------------------------------------------------
-- Seed parent role
-- -------------------------------------------------------------------------
INSERT IGNORE INTO roles (name) VALUES ('parent');
