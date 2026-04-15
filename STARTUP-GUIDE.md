# 🚀 Smart Personal Organizer - Complete Startup Guide

Follow these steps **in order** to get your application running.

---

## ✅ Step 1: Install Dependencies

From the project root directory, run a single command:

```bash
npm run install-all
```

**What this does:** Installs all required Node.js packages including React, Express, PostgreSQL driver, bcrypt for password hashing, etc.

---

## ✅ Step 2: Setup PostgreSQL Database

### Option A: Using Docker (Quickest)

```bash
# Remove any old container (ignore errors if it doesn't exist)
docker rm -f smart-postgres 2>/dev/null || true

# Start PostgreSQL 16 mapped to host port 5533
docker run -d --name smart-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgress \
  -e POSTGRES_DB=smart_organizer \
  -p 5533:5432 \
  -v pgdata_smart:/var/lib/postgresql/data \
  postgres:16

# (Optional) verify
docker ps
docker logs smart-postgres | tail -n 50
```

### Option B: Using GUI (pgAdmin, DBeaver, etc.)

1. Open your PostgreSQL GUI tool
2. Create a new database named: `smart_organizer`

**Note:** The app now defaults to the built-in `postgres` user. Creating a custom DB user is optional.

---

## ✅ Step 3: Configure Environment Variables

Create `server/.env` or copy from `.env.example`. Defaults are set for the Docker setup above:

```bash
DB_HOST=localhost
DB_PORT=5533
DB_NAME=smart_organizer
DB_USER=postgres
DB_PASSWORD=postgress
```

**What this does:** Tells the application how to connect to your database.

---

## ✅ Step 4: Run Database Migrations

This creates or updates all required tables safely (tracked by `schema_migrations`):

```bash
# From project root
npm run db:migrate
```

**What this does:** Creates/updates `members`, `users`, `skills`, `member_skills`, and `schema_migrations` tables using the safe migration runner.

---

## ✅ Step 5: Seed Admin User (Required)

```bash
npm run db:seed:users
```

**Expected Output:**
```
🌱 Seeding users table...

   ✓ Admin user created successfully
   Username: admin
   Password: admin
   Role: ADMIN

✅ User seeding completed!
```

**What this does:** Creates the admin user account so you can log in. No member data is seeded; add members manually via the UI.

---

## ✅ Step 6: Start the Application

From the **root directory**:

```bash
npm run dev
```

**Expected Output:**
```
[server] 🚀 Server running on http://localhost:3001
[server] 📊 API available at http://localhost:3001/api
[client] VITE ready in XXX ms
[client] ➜  Local:   http://localhost:5173/
```

**What this does:** Starts both the backend API server (port 3001) and frontend React app (port 5173) simultaneously.

---

## ✅ Step 7: Access the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. You'll see the login page
4. Login with:
   - **Username:** `admin`
   - **Password:** `admin`

---

## 🎉 You're Done!

After logging in, you can:

- **View Hierarchy:** See the organizational chart with expandable nodes
- **Members:** Browse all members in a data grid (search, filter, pagination)
- **Change Password:** Update your password (recommended!)
- **Settings:** Configure application settings
- **Logout:** Sign out of the application

---

## 📋 Quick Reference

### Application URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

### Default Credentials
- **Username:** admin
- **Password:** admin
- **Role:** ADMIN

### Important Files
- **Environment Config:** `server/.env`
- **Migrations:** `server/migrations/` and `server/scripts/migrate-safe.js`
- **User Seed:** `server/scripts/seed-users.js`

---

## 🔧 Common Issues & Solutions

### Issue: "Connection refused" error

**Solution:**
```bash
# Check if PostgreSQL is running
# macOS:
brew services list
brew services start postgresql

# Linux:
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Issue: "Database does not exist"

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE smart_organizer;"
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>

# Or change the port in .env
PORT=3002
```

### Issue: Migration fails with permission error

**Solution:** Ensure your `server/.env` matches your running DB (host/port/user/password). If using Docker command above, postgres/postgress on port 5533 will work.

---

## 🔄 Reset Everything (Docker)

If you need to start fresh:

```bash
# 1. Stop the application (Ctrl+C)

# 2. Reset container and volume
docker rm -f smart-postgres
docker volume rm pgdata_smart 2>/dev/null || true

# 3. Recreate DB quickly on port 5533
docker run -d --name smart-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgress \
  -e POSTGRES_DB=smart_organizer \
  -p 5533:5432 \
  -v pgdata_smart:/var/lib/postgresql/data \
  postgres:16

# 4. Run migrations again
npm run db:migrate
npm run db:seed:users

# 5. Restart application
npm run dev
```

---

## 📚 Next Steps

1. **Change your password** - Go to "Change Password" in the sidebar
2. **Add your own data** - Start adding your organizational structure
3. **Explore features** - Try the hierarchy view and table view
4. **Customize** - Modify the schema in `server/config/schema.json` to add new fields

---

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Check `COMMANDS.md` for all available commands
- Review the schema in `server/config/schema.json`

---

**Remember:** The default password is `admin/admin`. Please change it after your first login!
