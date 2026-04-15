# Database Migrations

This directory contains SQL migration files that modify the database schema.

## ⚠️ IMPORTANT - DO NOT DELETE THIS FOLDER

**This folder tracks your database state and should NEVER be overwritten or deleted.**

When you:
- Pull code from Git
- Extract a ZIP file
- Copy files to another machine

**Always preserve the `migrations/` folder and its contents.**

## How Migrations Work

1. Each migration file is named: `XXX_description.sql` (e.g., `001_initial_schema.sql`)
2. Migrations run in numerical order
3. Each migration runs only once (tracked in `schema_migrations` table)
4. Already-applied migrations are automatically skipped

## Adding New Migrations

### Example: Add a new column to employees table

Create file: `002_add_phone_to_employees.sql`

```sql
-- Migration: 002_add_phone_to_employees
-- Description: Add phone number field to employees
-- Date: 2026-04-15

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('002_add_phone_to_employees')
ON CONFLICT (migration_name) DO NOTHING;
```

### Example: Modify a column

Create file: `003_modify_email_length.sql`

```sql
-- Migration: 003_modify_email_length
-- Description: Increase email field length
-- Date: 2026-04-15

ALTER TABLE employees 
ALTER COLUMN email TYPE VARCHAR(320);

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('003_modify_email_length')
ON CONFLICT (migration_name) DO NOTHING;
```

### Example: Remove a column

Create file: `004_remove_old_field.sql`

```sql
-- Migration: 004_remove_old_field
-- Description: Remove deprecated field
-- Date: 2026-04-15

ALTER TABLE employees 
DROP COLUMN IF EXISTS old_field_name;

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('004_remove_old_field')
ON CONFLICT (migration_name) DO NOTHING;
```

### Example: Add a new table

Create file: `005_add_departments_table.sql`

```sql
-- Migration: 005_add_departments_table
-- Description: Create departments table
-- Date: 2026-04-15

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('005_add_departments_table')
ON CONFLICT (migration_name) DO NOTHING;
```

## Running Migrations

```bash
# Run all pending migrations
cd server
node scripts/migrate-safe.js
```

## Checking Migration Status

```bash
# Connect to database
psql -U demo -d smart_organizer

# View applied migrations
SELECT * FROM schema_migrations ORDER BY applied_at;

# Exit
\q
```

## Migration Naming Convention

Format: `XXX_description.sql`

- `XXX` = 3-digit number (001, 002, 003, etc.)
- `description` = brief description using underscores
- Always use `.sql` extension

Examples:
- ✅ `001_initial_schema.sql`
- ✅ `002_add_phone_field.sql`
- ✅ `010_create_projects_table.sql`
- ❌ `add_field.sql` (no number)
- ❌ `1_test.sql` (number too short)

## Best Practices

1. **Never edit existing migration files** - Create new ones instead
2. **Always use IF NOT EXISTS / IF EXISTS** - Makes migrations idempotent
3. **Test migrations locally first** - Before committing to Git
4. **One logical change per migration** - Easier to track and rollback
5. **Add comments** - Explain what and why

## Troubleshooting

### Migration fails midway

The script uses transactions, so failed migrations are automatically rolled back.

### Need to re-run a migration

```sql
-- Delete from tracking table
DELETE FROM schema_migrations WHERE migration_name = '002_add_phone_to_employees';

-- Then run migrate-safe.js again
```

### Reset all migrations (⚠️ DANGER - LOSES ALL DATA)

```bash
# Drop database and recreate
psql -U postgres -c "DROP DATABASE smart_organizer;"
psql -U postgres -c "CREATE DATABASE smart_organizer;"

# Run migrations from scratch
cd server
node scripts/migrate-safe.js
node scripts/seed-users.js
```

## Git and Version Control

**Always commit migration files to Git:**

```bash
git add server/migrations/
git commit -m "Add migration: description of change"
git push
```

**When pulling code:**

```bash
git pull
cd server
node scripts/migrate-safe.js  # Runs only new migrations
```

## Cross-Platform (Windows/Mac/Linux)

Migration files are plain SQL and work identically on all platforms.

No special handling needed for Windows vs Mac/Linux.
