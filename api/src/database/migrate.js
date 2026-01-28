#!/usr/bin/env node
/**
 * Database Migration Runner
 *
 * Usage:
 *   node migrate.js up           - Run all pending migrations
 *   node migrate.js down         - Rollback last migration batch
 *   node migrate.js status       - Show migration status
 *   node migrate.js create <name> - Create a new migration file
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "school_mgmt",
  multipleStatements: true,
  port: process.env.DB_PORT || 3306,
};

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const MIGRATIONS_TABLE = "schema_migrations";

class MigrationRunner {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(config);
      console.log("✓ Database connected");
    } catch (error) {
      console.error("✗ Database connection failed:", error.message);
      console.error("Config:", {
        host: config.host,
        user: config.user,
        database: config.database,
        port: config.port,
      });
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log("✓ Database disconnected");
    }
  }

  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INT,
        checksum VARCHAR(64),
        INDEX idx_migration_name (migration_name),
        INDEX idx_applied_at (applied_at)
      ) ENGINE=InnoDB;
    `;
    await this.connection.query(createTableSQL);
  }

  async getAppliedMigrations() {
    const [rows] = await this.connection.query(
      `SELECT migration_name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at ASC`
    );
    return rows.map((row) => row.migration_name);
  }

  async getMigrationFiles() {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => ({
        name: file.replace(".sql", ""),
        path: path.join(MIGRATIONS_DIR, file),
      }));
  }

  async getPendingMigrations() {
    const allMigrations = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    return allMigrations.filter((m) => !appliedMigrations.includes(m.name));
  }

  calculateChecksum(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async runMigration(migration) {
    const startTime = Date.now();
    console.log(`\n→ Running: ${migration.name}`);

    try {
      const content = await fs.readFile(migration.path, "utf8");
      const checksum = this.calculateChecksum(content);

      // Execute the migration SQL
      await this.connection.query(content);

      const executionTime = Date.now() - startTime;

      // Record the migration
      await this.connection.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (migration_name, execution_time_ms, checksum) VALUES (?, ?, ?)`,
        [migration.name, executionTime, checksum]
      );

      console.log(`✓ Completed in ${executionTime}ms`);
      return true;
    } catch (error) {
      console.error(`✗ Failed: ${error.message}`);
      throw error;
    }
  }

  async up() {
    console.log("=== Running Migrations ===\n");

    await this.ensureMigrationsTable();
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log("✓ No pending migrations");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)\n`);

    let successCount = 0;
    for (const migration of pending) {
      try {
        await this.runMigration(migration);
        successCount++;
      } catch (error) {
        console.error(`\n✗ Migration failed. Stopping here.`);
        console.error(`Applied: ${successCount}/${pending.length}`);
        throw error;
      }
    }

    console.log(`\n✓ Successfully applied ${successCount} migration(s)`);
  }

  async status() {
    console.log("=== Migration Status ===\n");

    await this.ensureMigrationsTable();
    const allMigrations = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();

    if (allMigrations.length === 0) {
      console.log("No migration files found");
      return;
    }

    console.log(`Total migrations: ${allMigrations.length}`);
    console.log(`Applied: ${appliedMigrations.length}`);
    console.log(`Pending: ${allMigrations.length - appliedMigrations.length}\n`);

    allMigrations.forEach((migration) => {
      const isApplied = appliedMigrations.includes(migration.name);
      const status = isApplied ? "✓ Applied" : "○ Pending";
      console.log(`${status}  ${migration.name}`);
    });
  }

  async down() {
    console.log("=== Rolling Back Last Migration ===\n");

    await this.ensureMigrationsTable();
    const [rows] = await this.connection.query(
      `SELECT migration_name FROM ${MIGRATIONS_TABLE} ORDER BY applied_at DESC LIMIT 1`
    );

    if (rows.length === 0) {
      console.log("✓ No migrations to rollback");
      return;
    }

    const lastMigration = rows[0].migration_name;
    console.log(`→ Rolling back: ${lastMigration}`);

    // Check if there's a corresponding .down.sql file
    const downFilePath = path.join(MIGRATIONS_DIR, `${lastMigration}.down.sql`);

    try {
      const downSQL = await fs.readFile(downFilePath, "utf8");
      await this.connection.query(downSQL);

      await this.connection.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE migration_name = ?`, [
        lastMigration,
      ]);

      console.log(`✓ Rolled back: ${lastMigration}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`⚠ No rollback file found: ${lastMigration}.down.sql`);
        console.log(`You'll need to manually rollback this migration`);
      } else {
        console.error(`✗ Rollback failed: ${error.message}`);
        throw error;
      }
    }
  }

  async create(name) {
    if (!name) {
      console.error("✗ Migration name is required");
      console.log("Usage: node migrate.js create <migration-name>");
      process.exit(1);
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const fileName = `${timestamp}_${name.replace(/\s+/g, "_")}`;
    const upFilePath = path.join(MIGRATIONS_DIR, `${fileName}.sql`);
    const downFilePath = path.join(MIGRATIONS_DIR, `${fileName}.down.sql`);

    const upTemplate = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add description here

USE school_mgmt;

-- Write your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN phone VARCHAR(20);

`;

    const downTemplate = `-- Rollback: ${name}
-- This file rolls back the changes made in ${fileName}.sql

USE school_mgmt;

-- Write your rollback SQL here
-- Example:
-- ALTER TABLE users DROP COLUMN phone;

`;

    try {
      await fs.writeFile(upFilePath, upTemplate);
      await fs.writeFile(downFilePath, downTemplate);
      console.log(`✓ Created migration files:`);
      console.log(`  ${fileName}.sql`);
      console.log(`  ${fileName}.down.sql`);
    } catch (error) {
      console.error(`✗ Failed to create migration: ${error.message}`);
      process.exit(1);
    }
  }
}

// Main execution
(async () => {
  const command = process.argv[2];
  const arg = process.argv[3];

  const runner = new MigrationRunner();

  try {
    if (command === "create") {
      await runner.create(arg);
      return;
    }

    await runner.connect();

    switch (command) {
      case "up":
        await runner.up();
        break;
      case "down":
        await runner.down();
        break;
      case "status":
        await runner.status();
        break;
      default:
        console.log("Database Migration Tool");
        console.log("\nUsage:");
        console.log("  npm run migrate:up       - Run all pending migrations");
        console.log("  npm run migrate:down     - Rollback last migration");
        console.log("  npm run migrate:status   - Show migration status");
        console.log("  npm run migrate:create <name> - Create new migration");
        process.exit(1);
    }

    await runner.disconnect();
  } catch (error) {
    console.error("\n✗ Migration failed:", error.message);
    await runner.disconnect();
    process.exit(1);
  }
})();
