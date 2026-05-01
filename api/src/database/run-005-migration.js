#!/usr/bin/env node
"use strict";

require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  const [versionRows] = await conn.query("SELECT VERSION() v");
  console.log("Connected to MySQL", versionRows[0].v);

  const run = async (label, sql) => {
    try {
      await conn.query(sql);
      console.log("OK:", label);
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME" || (e.message && e.message.includes("Duplicate column"))) {
        console.log("SKIP (already exists):", label);
      } else {
        throw e;
      }
    }
  };

  // ─── course_sections ────────────────────────────────────────────────────────
  await run(
    "cs.status",
    "ALTER TABLE course_sections ADD COLUMN `status` ENUM('draft','archived') NOT NULL DEFAULT 'draft' AFTER order_index"
  );
  await run(
    "cs.created_by",
    "ALTER TABLE course_sections ADD COLUMN created_by INT UNSIGNED NULL AFTER `status`"
  );
  await run(
    "cs.updated_by",
    "ALTER TABLE course_sections ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by"
  );

  // ─── lessons ────────────────────────────────────────────────────────────────
  await run(
    "ls.status",
    "ALTER TABLE lessons ADD COLUMN `status` ENUM('draft','archived') NOT NULL DEFAULT 'draft' AFTER order_index"
  );
  await run(
    "ls.estimated_duration",
    "ALTER TABLE lessons ADD COLUMN estimated_duration DECIMAL(6,2) NULL AFTER `status`"
  );
  await run(
    "ls.created_by",
    "ALTER TABLE lessons ADD COLUMN created_by INT UNSIGNED NULL AFTER estimated_duration"
  );
  await run(
    "ls.updated_by",
    "ALTER TABLE lessons ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by"
  );

  // ─── Foreign keys ───────────────────────────────────────────────────────────
  const fks = [
    [
      "fk_sections_created_by",
      "ALTER TABLE course_sections ADD CONSTRAINT fk_sections_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL",
    ],
    [
      "fk_sections_updated_by",
      "ALTER TABLE course_sections ADD CONSTRAINT fk_sections_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL",
    ],
    [
      "fk_lessons_created_by",
      "ALTER TABLE lessons ADD CONSTRAINT fk_lessons_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL",
    ],
    [
      "fk_lessons_updated_by",
      "ALTER TABLE lessons ADD CONSTRAINT fk_lessons_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL",
    ],
  ];
  for (const [label, sql] of fks) {
    try {
      await conn.query(sql);
      console.log("OK:", label);
    } catch (e) {
      console.log("SKIP FK:", label, "-", e.message.split("\n")[0]);
    }
  }

  // ─── New tables ─────────────────────────────────────────────────────────────
  const [tableRows] = await conn.query("SHOW TABLES");
  const existing = tableRows.map((r) => Object.values(r)[0]);

  if (!existing.includes("content_assets")) {
    await conn.query(`
      CREATE TABLE content_assets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        media_type VARCHAR(50) NOT NULL COMMENT 'video | image | document | audio',
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NULL,
        duration_seconds INT NULL,
        storage_key VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500) NULL,
        uploaded_by INT UNSIGNED NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_assets_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_assets_uploaded_by (uploaded_by)
      ) ENGINE=InnoDB
    `);
    console.log("OK: created content_assets");
  } else {
    console.log("SKIP: content_assets already exists");
  }

  if (!existing.includes("learning_items")) {
    await conn.query(`
      CREATE TABLE learning_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        lesson_id INT UNSIGNED NOT NULL,
        item_type ENUM('VIDEO','QUIZ','INFOGRAPHIC','DOCUMENT','TEXT') NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_payload JSON NULL COMMENT 'Type-specific config',
        asset_id INT UNSIGNED NULL,
        display_order INT NOT NULL DEFAULT 0,
        estimated_duration DECIMAL(6,2) NULL,
        is_required BOOLEAN NOT NULL DEFAULT FALSE,
        \`status\` ENUM('draft','archived') NOT NULL DEFAULT 'draft',
        created_by INT UNSIGNED NULL,
        updated_by INT UNSIGNED NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_items_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        CONSTRAINT fk_items_asset FOREIGN KEY (asset_id) REFERENCES content_assets(id) ON DELETE SET NULL,
        CONSTRAINT fk_items_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_items_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_items_lesson (lesson_id)
      ) ENGINE=InnoDB
    `);
    console.log("OK: created learning_items");
  } else {
    console.log("SKIP: learning_items already exists");
  }

  if (!existing.includes("content_versions")) {
    await conn.query(`
      CREATE TABLE content_versions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        course_id INT UNSIGNED NOT NULL,
        version_label VARCHAR(100) NOT NULL,
        version_no INT UNSIGNED NOT NULL DEFAULT 1,
        \`status\` ENUM('DRAFT','REVIEW','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
        changelog TEXT NULL,
        snapshot_ref JSON NULL,
        published_at DATETIME NULL,
        published_by INT UNSIGNED NULL,
        created_by INT UNSIGNED NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cv_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        CONSTRAINT fk_cv_published_by FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_cv_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_cv_course (course_id)
      ) ENGINE=InnoDB
    `);
    console.log("OK: created content_versions");
  } else {
    console.log("SKIP: content_versions already exists");
  }

  await conn.end();
  console.log("\nMigration complete!");
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
