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
  console.log("Connected to MySQL", (await conn.query("SELECT VERSION() v"))[0][0].v);

  const colExists = async (table, col) => {
    const [[{ cnt }]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
      [table, col]
    );
    return cnt > 0;
  };
  const fkExists = async (table, name) => {
    const [[{ cnt }]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = ? AND constraint_name = ?",
      [table, name]
    );
    return cnt > 0;
  };

  const run = async (label, sql) => {
    try {
      await conn.query(sql);
      console.log("OK:", label);
    } catch (e) {
      console.log("FAIL:", label, "-", e.message.split("\n")[0]);
    }
  };

  // ─── courses: add missing columns ─────────────────────────────────────────
  if (!(await colExists("courses", "course_code"))) {
    await run(
      "courses.course_code",
      "ALTER TABLE courses ADD COLUMN course_code VARCHAR(50) NOT NULL DEFAULT '' AFTER id"
    );
    await run(
      "courses.course_code.backfill",
      "UPDATE courses SET course_code = CONCAT('COURSE-', LPAD(id, 5, '0')) WHERE course_code = ''"
    );
    await run(
      "courses.course_code.unique",
      "ALTER TABLE courses ADD UNIQUE KEY uq_course_code (course_code)"
    );
  } else {
    console.log("SKIP: courses.course_code");
  }

  if (!(await colExists("courses", "department_id"))) {
    await run(
      "courses.department_id",
      "ALTER TABLE courses ADD COLUMN department_id INT UNSIGNED NULL AFTER course_code"
    );
  } else {
    console.log("SKIP: courses.department_id");
  }

  if (!(await colExists("courses", "course_type"))) {
    await run(
      "courses.course_type",
      "ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) NOT NULL DEFAULT 'general' AFTER description"
    );
  } else {
    console.log("SKIP: courses.course_type");
  }

  if (!(await colExists("courses", "credit"))) {
    await run(
      "courses.credit",
      "ALTER TABLE courses ADD COLUMN credit DECIMAL(5,2) NULL AFTER course_type"
    );
  } else {
    console.log("SKIP: courses.credit");
  }

  if (!(await colExists("courses", "duration_hours"))) {
    await run(
      "courses.duration_hours",
      "ALTER TABLE courses ADD COLUMN duration_hours DECIMAL(6,2) NULL AFTER credit"
    );
  } else {
    console.log("SKIP: courses.duration_hours");
  }

  if (!(await colExists("courses", "thumbnail_url"))) {
    await run(
      "courses.thumbnail_url",
      "ALTER TABLE courses ADD COLUMN thumbnail_url VARCHAR(500) NULL AFTER price"
    );
  } else {
    console.log("SKIP: courses.thumbnail_url");
  }

  if (!(await colExists("courses", "effective_from"))) {
    await run(
      "courses.effective_from",
      "ALTER TABLE courses ADD COLUMN effective_from DATE NULL AFTER thumbnail_url"
    );
  } else {
    console.log("SKIP: courses.effective_from");
  }

  if (!(await colExists("courses", "effective_to"))) {
    await run(
      "courses.effective_to",
      "ALTER TABLE courses ADD COLUMN effective_to DATE NULL AFTER effective_from"
    );
  } else {
    console.log("SKIP: courses.effective_to");
  }

  if (!(await colExists("courses", "is_deleted"))) {
    await run(
      "courses.is_deleted",
      "ALTER TABLE courses ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER effective_to"
    );
  } else {
    console.log("SKIP: courses.is_deleted");
  }

  if (!(await colExists("courses", "created_by"))) {
    await run(
      "courses.created_by",
      "ALTER TABLE courses ADD COLUMN created_by INT UNSIGNED NULL AFTER is_deleted"
    );
  } else {
    console.log("SKIP: courses.created_by");
  }

  if (!(await colExists("courses", "updated_by"))) {
    await run(
      "courses.updated_by",
      "ALTER TABLE courses ADD COLUMN updated_by INT UNSIGNED NULL AFTER created_by"
    );
  } else {
    console.log("SKIP: courses.updated_by");
  }

  // Extend status ENUM to include 'inactive' (run regardless — it's idempotent)
  await run(
    "courses.status.extend",
    "ALTER TABLE courses MODIFY COLUMN `status` ENUM('draft','active','inactive','archived') NOT NULL DEFAULT 'draft'"
  );

  // ─── Rename instructor_id → teacher_id ────────────────────────────────────
  if (await colExists("courses", "instructor_id")) {
    // Drop old FK if exists
    if (await fkExists("courses", "fk_courses_instructor")) {
      await run(
        "courses.drop_fk_instructor",
        "ALTER TABLE courses DROP FOREIGN KEY fk_courses_instructor"
      );
    }
    if (await fkExists("courses", "courses_ibfk_1")) {
      await run("courses.drop_fk_ibfk1", "ALTER TABLE courses DROP FOREIGN KEY courses_ibfk_1");
    }
    await run(
      "courses.rename_instructor_to_teacher",
      "ALTER TABLE courses CHANGE COLUMN instructor_id teacher_id INT UNSIGNED NOT NULL"
    );
    if (!(await fkExists("courses", "fk_courses_teacher"))) {
      await run(
        "courses.fk_teacher",
        "ALTER TABLE courses ADD CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE"
      );
    }
  } else {
    console.log("SKIP: instructor_id already renamed to teacher_id");
    if (!(await fkExists("courses", "fk_courses_teacher"))) {
      await run(
        "courses.fk_teacher",
        "ALTER TABLE courses ADD CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE"
      );
    }
  }

  // ─── Add FK for department_id ─────────────────────────────────────────────
  if (!(await fkExists("courses", "fk_courses_dept"))) {
    await run(
      "courses.fk_dept",
      "ALTER TABLE courses ADD CONSTRAINT fk_courses_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL"
    );
  } else {
    console.log("SKIP: fk_courses_dept");
  }

  // ─── Rename role 'instructor' → 'teacher' in roles table ──────────────────
  await run(
    "roles.rename_instructor",
    "UPDATE roles SET name = 'teacher' WHERE name = 'instructor'"
  );

  await conn.end();
  console.log("\nAll done!");
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
