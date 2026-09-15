-- Rollback: Assessment Definition / Version / Assignment bridge

USE school_mgmt;

DROP TABLE IF EXISTS assessment_assignments;
DROP TABLE IF EXISTS assessment_versions;
DROP TABLE IF EXISTS assessment_definitions;
