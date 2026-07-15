-- ============================================================
-- Migration 013: Org structure tables
-- Creates branches, campuses, locations (tenant -> branch ->
-- campus -> location hierarchy, locations self-referencing via
-- parent_location_id). FK delete behavior matches what Sequelize
-- sync() generates elsewhere in this codebase: CASCADE for
-- required (NOT NULL) FKs, SET NULL for optional ones.
-- ============================================================

USE school_mgmt;

CREATE TABLE IF NOT EXISTS branches (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT UNSIGNED NOT NULL,
  branch_code   VARCHAR(50) NOT NULL,
  branch_name   VARCHAR(255) NOT NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY branches_tenant_id_branch_code (tenant_id, branch_code),
  CONSTRAINT fk_branches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campuses (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT UNSIGNED NOT NULL,
  branch_id     INT UNSIGNED NOT NULL,
  campus_code   VARCHAR(50) NOT NULL,
  campus_name   VARCHAR(255) NOT NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY campuses_branch_id_campus_code (branch_id, campus_code),
  CONSTRAINT fk_campuses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_campuses_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locations (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id           INT UNSIGNED NOT NULL,
  branch_id           INT UNSIGNED NOT NULL,
  campus_id           INT UNSIGNED NOT NULL,
  parent_location_id  INT UNSIGNED NULL,
  location_code       VARCHAR(50) NOT NULL,
  location_name       VARCHAR(255) NOT NULL,
  location_type       ENUM('building','floor','room','hall','lab','outdoor','virtual') NOT NULL DEFAULT 'room',
  capacity            INT UNSIGNED NULL,
  status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  metadata            JSON NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY locations_campus_id_location_code (campus_id, location_code),
  CONSTRAINT fk_locations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_locations_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_locations_campus FOREIGN KEY (campus_id) REFERENCES campuses(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_locations_parent FOREIGN KEY (parent_location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
