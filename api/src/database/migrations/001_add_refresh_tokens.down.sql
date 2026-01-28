-- Rollback: Add refresh tokens
-- This file rolls back the changes made in 001_add_refresh_tokens.sql

USE school_mgmt;

DROP TABLE IF EXISTS refresh_tokens;
