# Database Migration Guide

## Overview

This project uses a custom database migration system to manage schema changes in a version-controlled and reproducible way.

## Quick Start

### Check Migration Status

```bash
npm run migrate:status
```

This shows which migrations have been applied and which are pending.

### Run Pending Migrations

```bash
npm run migrate:up
```

This applies all pending migrations in order.

### Rollback Last Migration

```bash
npm run migrate:down
```

This rolls back the most recently applied migration (if a `.down.sql` file exists).

### Create a New Migration

```bash
npm run migrate:create add_user_phone_column
```

This creates two files:

- `[timestamp]_add_user_phone_column.sql` - The migration
- `[timestamp]_add_user_phone_column.down.sql` - The rollback

## Migration File Structure

All migration files are stored in:

```
api/src/database/migrations/
```

### Naming Convention

Migration files follow this format:

```
[timestamp]_[description].sql
[timestamp]_[description].down.sql
```

Examples:

- `20260127123000_add_user_phone_column.sql`
- `20260127123000_add_user_phone_column.down.sql`

### Migration Order

Migrations are executed in alphabetical/chronological order based on their filename. The timestamp prefix ensures correct ordering.

## Writing Migrations

### Basic Structure

Every migration should:

1. Start with `USE school_mgmt;`
2. Include idempotent checks (IF EXISTS, IF NOT EXISTS)
3. Have a clear description at the top
4. Include a corresponding rollback file

### Example: Adding a Column

**File: `20260127123000_add_user_phone.sql`**

```sql
-- Migration: Add phone column to users
-- Created: 2026-01-27
-- Description: Add optional phone number field for users

USE school_mgmt;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER email;
```

**File: `20260127123000_add_user_phone.down.sql`**

```sql
-- Rollback: Add phone column to users

USE school_mgmt;

ALTER TABLE users
  DROP COLUMN IF EXISTS phone;
```

### Example: Creating a Table

**File: `20260127124500_create_categories.sql`**

```sql
-- Migration: Create categories table
-- Created: 2026-01-27
-- Description: Add course categories support

USE school_mgmt;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Add category_id to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS category_id INT UNSIGNED AFTER instructor_id,
  ADD CONSTRAINT fk_courses_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
```

**File: `20260127124500_create_categories.down.sql`**

```sql
-- Rollback: Create categories table

USE school_mgmt;

-- Remove foreign key first
ALTER TABLE courses DROP FOREIGN KEY IF EXISTS fk_courses_category;
ALTER TABLE courses DROP COLUMN IF EXISTS category_id;

-- Drop the table
DROP TABLE IF EXISTS categories;
```

### Example: Modifying Data

**File: `20260127130000_update_role_names.sql`**

```sql
-- Migration: Standardize role names
-- Created: 2026-01-27
-- Description: Update role names to lowercase

USE school_mgmt;

UPDATE roles SET name = 'admin' WHERE name = 'Admin';
UPDATE roles SET name = 'instructor' WHERE name = 'Instructor' OR name = 'Teacher';
UPDATE roles SET name = 'student' WHERE name = 'Student';
```

**File: `20260127130000_update_role_names.down.sql`**

```sql
-- Rollback: Standardize role names

USE school_mgmt;

UPDATE roles SET name = 'Admin' WHERE name = 'admin';
UPDATE roles SET name = 'Instructor' WHERE name = 'instructor';
UPDATE roles SET name = 'Student' WHERE name = 'student';
```

## Best Practices

### 1. **Always Create Rollback Files**

Every `.sql` file should have a corresponding `.down.sql` file for rollback scenarios.

### 2. **Use Idempotent Operations**

Make migrations safe to run multiple times:

- Use `IF NOT EXISTS` when creating
- Use `IF EXISTS` when dropping
- Check for existence before altering

### 3. **One Logical Change Per Migration**

Keep migrations focused on a single feature or change:

- ✅ Good: `add_user_avatar_column.sql`
- ❌ Bad: `add_multiple_features_and_fix_bugs.sql`

### 4. **Test Migrations Thoroughly**

Before applying to production:

1. Test migration on a copy of production data
2. Test the rollback immediately after
3. Verify application still works after rollback

### 5. **Include Comments**

Add clear descriptions:

```sql
-- Migration: Add email verification
-- Created: 2026-01-27
-- Description: Add columns to track email verification status
-- Affects: users table
-- Related to: Issue #123
```

### 6. **Handle Foreign Keys Carefully**

Always drop foreign keys before modifying referenced columns:

```sql
-- Drop FK first
ALTER TABLE courses DROP FOREIGN KEY fk_courses_instructor;

-- Modify column
ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED;

-- Recreate FK
ALTER TABLE courses ADD CONSTRAINT fk_courses_instructor
  FOREIGN KEY (instructor_id) REFERENCES users(id);
```

### 7. **Backup Before Complex Migrations**

For risky changes, backup first:

```bash
docker exec mysql18 mysqldump -uroot -p school_mgmt > backup_before_migration.sql
```

## Workflow Examples

### Adding a New Feature

1. **Create migration:**

   ```bash
   npm run migrate:create add_course_tags
   ```

2. **Edit the generated files:**
   - Write migration SQL in `.sql` file
   - Write rollback SQL in `.down.sql` file

3. **Check status:**

   ```bash
   npm run migrate:status
   ```

4. **Apply migration:**

   ```bash
   npm run migrate:up
   ```

5. **Test the feature**

6. **If issues, rollback:**
   ```bash
   npm run migrate:down
   ```

### Handling Production Migrations

1. **Test locally first:**

   ```bash
   npm run migrate:up
   # Test application
   npm run migrate:down
   # Test rollback
   npm run migrate:up
   # Test again
   ```

2. **Backup production database:**

   ```bash
   # Create backup before deployment
   docker exec mysql18 mysqldump -uroot -p school_mgmt > prod_backup_YYYYMMDD.sql
   ```

3. **Apply to production:**

   ```bash
   npm run migrate:status  # Verify pending migrations
   npm run migrate:up      # Apply migrations
   ```

4. **Monitor and verify:**
   - Check application logs
   - Verify data integrity
   - Test critical features

## Troubleshooting

### Migration Failed Midway

If a migration fails:

1. Check the error message
2. Fix the SQL in the migration file
3. Manually rollback any partial changes
4. Re-run the migration

### Migration Already Applied

The system tracks applied migrations in `schema_migrations` table. To re-run:

```sql
DELETE FROM schema_migrations WHERE migration_name = 'your_migration_name';
```

### Checksum Mismatch

If you modify an already-applied migration, the checksum will differ. This is intentional to detect tampering. Options:

1. Create a new migration instead
2. Rollback, modify, and re-apply
3. Update checksum manually (not recommended)

## Migration System Architecture

### Tracking Table

Migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INT,
  checksum VARCHAR(64)
);
```

### Migration Runner

The [migrate.js](../src/database/migrate.js) script:

- Reads migration files from the migrations directory
- Tracks which have been applied
- Executes SQL in transactions when possible
- Records execution time and checksum
- Provides rollback capability

## CI/CD Integration

### Automated Testing

Add to your CI pipeline:

```bash
# Check for pending migrations
npm run migrate:status

# Run migrations in test environment
npm run migrate:up
```

### Deployment Script

Example deployment:

```bash
#!/bin/bash
# Backup database
docker exec mysql18 mysqldump -uroot -p$DB_PASSWORD school_mgmt > backup.sql

# Run migrations
npm run migrate:up

# If migrations fail, rollback
if [ $? -ne 0 ]; then
  echo "Migration failed, rolling back"
  npm run migrate:down
  exit 1
fi
```

## Additional Commands

### Direct Script Usage

You can also run the migration script directly:

```bash
node src/database/migrate.js up
node src/database/migrate.js down
node src/database/migrate.js status
node src/database/migrate.js create my_new_migration
```

### Manual SQL Execution

For one-off fixes or data corrections, you can still run SQL directly:

```bash
docker exec -it mysql18 mysql -uroot -p school_mgmt
```

But prefer creating migrations for reproducibility.

## FAQ

**Q: Can I modify an already-applied migration?**
A: No. Create a new migration instead. The checksum system will detect changes to applied migrations.

**Q: What if I need to run migrations on multiple environments?**
A: The same migration files work across all environments. Just run `npm run migrate:up` on each.

**Q: Can migrations be run automatically on server start?**
A: Yes, but it's risky. Better to run manually during deployment. If needed, add to `server.js`:

```javascript
const { exec } = require("child_process");
exec("npm run migrate:up", (err, stdout) => {
  if (err) console.error("Migration error:", err);
  console.log(stdout);
});
```

**Q: How do I handle long-running migrations?**
A: For large tables, consider:

- Running migrations during low-traffic periods
- Using online schema change tools (pt-online-schema-change)
- Breaking into smaller batches

**Q: Can I have migrations that depend on each other?**
A: Yes, that's the point! They run in order. Just ensure proper naming with timestamps.

## Summary

| Command                         | Purpose                      |
| ------------------------------- | ---------------------------- |
| `npm run migrate:up`            | Apply all pending migrations |
| `npm run migrate:down`          | Rollback last migration      |
| `npm run migrate:status`        | Show migration status        |
| `npm run migrate:create <name>` | Create new migration files   |

For more information, see the [migration script](../src/database/migrate.js) source code.
