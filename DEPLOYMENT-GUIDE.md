# 🚀 Deployment & Code Transfer Guide

This guide covers how to safely transfer your code between machines (Mac to Windows, Git, ZIP files) without losing data.

---

## 🔒 Critical Files - NEVER OVERWRITE

These files/folders contain your **state and data**. Preserve them when transferring code:

### 1. `server/migrations/` folder
- **Contains:** Database migration history
- **Why critical:** Tracks which schema changes have been applied
- **Action:** Always preserve, never delete

### 2. `.env` file
- **Contains:** Your database credentials and configuration
- **Why critical:** Contains your specific settings
- **Action:** Keep your existing `.env`, don't overwrite with default

### 3. Database itself
- **Contains:** All your actual data (employees, users, etc.)
- **Why critical:** Your actual data lives here
- **Action:** Backup before major changes

---

## 📦 Method 1: Using Git (Recommended)

### On Your Mac (Initial Setup)

```bash
# Initialize Git (already done)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit with migration system"

# Add remote (GitHub, GitLab, Bitbucket, etc.)
git remote add origin https://github.com/yourusername/smart-organizer.git

# Push
git push -u origin main
```

### On Windows Laptop (First Time)

```bash
# Clone repository
git clone https://github.com/yourusername/smart-organizer.git
cd smart-organizer

# Install dependencies
npm install
cd server
npm install
cd ..
cd client
npm install
cd ..

# Create your .env file (don't use the one from Git)
copy .env.example .env
# Edit .env with your Windows PostgreSQL credentials

# Setup database
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "CREATE USER demo WITH PASSWORD 'demo';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# Run migrations
cd server
node scripts/migrate-safe.js
node scripts/seed-users.js
cd ..

# Start app
npm run dev
```

### Updating Code (Mac to Windows)

**On Mac (after making changes):**
```bash
# Add new migration if schema changed
# (see server/migrations/README.md)

git add .
git commit -m "Description of changes"
git push
```

**On Windows (pulling updates):**
```bash
# Pull latest code
git pull

# Install any new dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run new migrations (only new ones will run)
cd server
node scripts/migrate-safe.js
cd ..

# Restart app
npm run dev
```

**✅ Safe:** Your `migrations/` folder and `.env` are preserved by Git!

---

## 📦 Method 2: Using ZIP File

### Creating ZIP on Mac

```bash
# Create ZIP excluding sensitive files
zip -r smart-organizer.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.env" \
  -x "*dist*" \
  -x "*build*"
```

This excludes:
- Git history (`.git/`)
- Dependencies (`node_modules/`)
- Environment file (`.env`)
- Build outputs

**✅ Includes:** `server/migrations/` folder (important!)

### Extracting ZIP on Windows

**⚠️ IMPORTANT: First Time vs Update**

#### First Time (New Installation)

```powershell
# Extract ZIP to new folder
Expand-Archive -Path smart-organizer.zip -DestinationPath C:\Projects\smart-organizer

cd C:\Projects\smart-organizer

# Create .env file
copy .env.example .env
# Edit .env with your credentials

# Install dependencies
npm install
cd server
npm install
cd ..
cd client
npm install
cd ..

# Setup database and run migrations
# (same as Git method above)
```

#### Updating Existing Installation

**⚠️ CRITICAL: Protect your migrations folder!**

```powershell
# 1. BACKUP your migrations folder first
cd C:\Projects\smart-organizer\server
copy migrations migrations-backup -Recurse

# 2. BACKUP your .env file
cd C:\Projects\smart-organizer
copy .env .env.backup

# 3. Extract new ZIP to temporary location
Expand-Archive -Path smart-organizer-new.zip -DestinationPath C:\Temp\smart-new

# 4. Copy files EXCEPT migrations and .env
# Use robocopy to selectively copy
robocopy C:\Temp\smart-new C:\Projects\smart-organizer /E /XD migrations node_modules .git /XF .env

# 5. Restore your migrations if overwritten
# (Usually not needed if you used robocopy correctly)
# copy migrations-backup\* migrations\ -Recurse -Force

# 6. Install dependencies
npm install
cd server
npm install
cd ..
cd client
npm install
cd ..

# 7. Run new migrations
cd server
node scripts/migrate-safe.js
cd ..
```

### Safer ZIP Update Method (Recommended)

```powershell
# 1. Rename old folder
Rename-Item C:\Projects\smart-organizer C:\Projects\smart-organizer-old

# 2. Extract new ZIP
Expand-Archive -Path smart-organizer-new.zip -DestinationPath C:\Projects\smart-organizer

# 3. Copy critical files from old to new
copy C:\Projects\smart-organizer-old\.env C:\Projects\smart-organizer\.env
copy C:\Projects\smart-organizer-old\server\migrations\* C:\Projects\smart-organizer\server\migrations\ -Recurse -Force

# 4. Install and run
cd C:\Projects\smart-organizer
npm install
cd server
npm install
node scripts/migrate-safe.js
cd ..
cd client
npm install
cd ..

# 5. Test everything works
npm run dev

# 6. Delete old folder once confirmed
Remove-Item C:\Projects\smart-organizer-old -Recurse -Force
```

---

## 🛡️ .gitignore Protection

Your `.gitignore` file already protects:

```
# These are NOT committed to Git
node_modules/
.env
dist/
build/
```

But **migrations/** folder IS committed (intentionally).

---

## 📋 Pre-Transfer Checklist

Before transferring code:

- [ ] All changes committed to Git (if using Git)
- [ ] New migrations created for schema changes
- [ ] Dependencies updated in package.json
- [ ] Documentation updated
- [ ] Tested locally

---

## 🔄 Schema Change Workflow

### Adding a New Column

**1. On Mac - Create Migration:**

```bash
# Create file: server/migrations/002_add_phone_to_employees.sql
```

```sql
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

INSERT INTO schema_migrations (migration_name) 
VALUES ('002_add_phone_to_employees')
ON CONFLICT (migration_name) DO NOTHING;
```

**2. Test Migration:**

```bash
cd server
node scripts/migrate-safe.js
```

**3. Commit to Git:**

```bash
git add server/migrations/002_add_phone_to_employees.sql
git commit -m "Add phone column to employees"
git push
```

**4. On Windows - Pull and Apply:**

```bash
git pull
cd server
node scripts/migrate-safe.js  # Automatically runs only new migration
```

**✅ Result:** Schema updated, data preserved!

---

## 🪟 Windows-Specific Notes

### Path Differences

**Mac/Linux:**
```bash
cd server/migrations
```

**Windows (PowerShell):**
```powershell
cd server\migrations
```

**Windows (Command Prompt):**
```cmd
cd server\migrations
```

### PostgreSQL on Windows

**Installation:**
- Download from: https://www.postgresql.org/download/windows/
- Or use: `choco install postgresql` (if using Chocolatey)

**Start PostgreSQL:**
```powershell
# Using services
net start postgresql-x64-14

# Or use pgAdmin GUI
```

**Connect to PostgreSQL:**
```powershell
# Using psql
psql -U postgres

# Or use pgAdmin, DBeaver, or other GUI tools
```

### Node.js on Windows

Ensure you have Node.js 22.x:
```powershell
node --version  # Should show v22.x.x
```

Download from: https://nodejs.org/

---

## 🔍 Verify Migration State

Check which migrations have been applied:

```sql
-- Connect to database
psql -U demo -d smart_organizer

-- View migration history
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Expected output:
--  id |    migration_name     |       applied_at        
-- ----+-----------------------+-------------------------
--   1 | 001_initial_schema    | 2026-04-15 10:30:00
--   2 | 002_add_phone_field   | 2026-04-15 11:45:00
```

---

## 🆘 Troubleshooting

### "Migration already applied" but table doesn't exist

```sql
-- Check if table exists
\dt

-- If missing, remove from tracking and re-run
DELETE FROM schema_migrations WHERE migration_name = '001_initial_schema';
```

Then run `node scripts/migrate-safe.js` again.

### Lost migrations folder

If you accidentally deleted it:

1. **From Git:** `git checkout server/migrations/`
2. **From backup:** Restore from your backup
3. **Rebuild:** Check database for applied migrations, recreate files

### Different database on Windows

Update `.env` on Windows:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_organizer
DB_USER=your_windows_username
DB_PASSWORD=your_windows_password
```

---

## ✅ Best Practices Summary

1. **Use Git** - Safest method for code transfer
2. **Never edit old migrations** - Create new ones
3. **Always backup** - Before major changes
4. **Test locally first** - Before pushing to production
5. **Keep migrations folder** - Never delete or overwrite
6. **Document changes** - In migration file comments
7. **Use safe migration script** - `migrate-safe.js` not `migrate.js`

---

## 📚 Related Documentation

- `server/migrations/README.md` - Migration examples
- `QUICK-START.md` - Initial setup
- `COMMANDS.md` - All commands reference

---

**Remember:** The `migrations/` folder is your database's version control. Treat it like your data!
