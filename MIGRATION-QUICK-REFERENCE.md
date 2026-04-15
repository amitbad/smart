# 🔄 Migration System - Quick Reference Card

## ✅ What Changed

**OLD System (`migrate.js`):**
- ❌ Drops and recreates tables
- ❌ Loses all data
- ❌ No history tracking

**NEW System (`migrate-safe.js`):**
- ✅ Preserves existing data
- ✅ Tracks migration history
- ✅ Runs only new migrations
- ✅ Safe for production

---

## 🚀 Quick Commands

### Run Migrations (Safe)
```bash
cd server
node scripts/migrate-safe.js
```

### Check Migration Status
```bash
psql -U demo -d smart_organizer -c "SELECT * FROM schema_migrations;"
```

---

## 📝 Common Tasks

### 1. Add New Column

**Create:** `server/migrations/002_add_phone.sql`

```sql
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

INSERT INTO schema_migrations (migration_name) 
VALUES ('002_add_phone')
ON CONFLICT (migration_name) DO NOTHING;
```

**Run:**
```bash
cd server
node scripts/migrate-safe.js
```

### 2. Modify Column

**Create:** `server/migrations/003_modify_email.sql`

```sql
ALTER TABLE employees 
ALTER COLUMN email TYPE VARCHAR(320);

INSERT INTO schema_migrations (migration_name) 
VALUES ('003_modify_email')
ON CONFLICT (migration_name) DO NOTHING;
```

### 3. Remove Column

**Create:** `server/migrations/004_remove_field.sql`

```sql
ALTER TABLE employees 
DROP COLUMN IF EXISTS old_field;

INSERT INTO schema_migrations (migration_name) 
VALUES ('004_remove_field')
ON CONFLICT (migration_name) DO NOTHING;
```

### 4. Add New Table

**Create:** `server/migrations/005_add_departments.sql`

```sql
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (migration_name) 
VALUES ('005_add_departments')
ON CONFLICT (migration_name) DO NOTHING;
```

---

## 🔒 Files to NEVER Overwrite

When extracting ZIP or pulling code:

1. **`server/migrations/`** - Migration history (CRITICAL!)
2. **`.env`** - Your database credentials
3. **Database** - Your actual data

---

## 📦 Transfer Code Safely

### Using Git (Recommended)

**Mac:**
```bash
git add .
git commit -m "Your changes"
git push
```

**Windows:**
```powershell
git pull
cd server
node scripts/migrate-safe.js
```

### Using ZIP

**Create ZIP (Mac):**
```bash
zip -r smart.zip . -x "*node_modules*" -x "*.git*" -x "*.env"
```

**Extract ZIP (Windows):**
```powershell
# First time: Extract normally
Expand-Archive smart.zip -DestinationPath C:\Projects\smart

# Updates: Backup migrations first!
copy server\migrations migrations-backup -Recurse
# Then extract and restore migrations
```

---

## 🪟 Windows Commands

All commands work on Windows, just use backslashes:

```powershell
cd server\migrations
node ..\scripts\migrate-safe.js
```

Or use forward slashes (PowerShell supports both):
```powershell
cd server/migrations
node ../scripts/migrate-safe.js
```

---

## 🆘 Emergency Recovery

### Lost Migration Files

```bash
# Restore from Git
git checkout server/migrations/

# Or restore from backup
```

### Migration Failed

```bash
# Check error in terminal
# Fix the SQL in migration file
# Delete from tracking table:
psql -U demo -d smart_organizer
DELETE FROM schema_migrations WHERE migration_name = 'failed_migration_name';
\q

# Run again
node scripts/migrate-safe.js
```

---

## ✅ Best Practices

1. ✅ Always use `migrate-safe.js` (not `migrate.js`)
2. ✅ Never edit existing migration files
3. ✅ Always use `IF NOT EXISTS` / `IF EXISTS`
4. ✅ Test migrations locally first
5. ✅ Commit migrations to Git
6. ✅ Backup before major changes

---

## 📚 Full Documentation

- **Detailed Guide:** `server/migrations/README.md`
- **Deployment:** `DEPLOYMENT-GUIDE.md`
- **All Commands:** `COMMANDS.md`

---

**Remember:** Migrations are your database's version control!
