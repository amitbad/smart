# 🚀 Smart Personal Organizer - Complete Startup Guide

Follow these steps **in order** to get your application running.

---

## ✅ Step 1: Install Dependencies

Run these commands from the project root directory:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

**What this does:** Installs all required Node.js packages including React, Express, PostgreSQL driver, bcrypt for password hashing, etc.

---

## ✅ Step 2: Setup PostgreSQL Database

### Option A: Using Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these commands in psql:
CREATE DATABASE smart_organizer;
CREATE USER demo WITH PASSWORD 'demo';
GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;
\q
```

### Option B: Using GUI (pgAdmin, DBeaver, etc.)

1. Open your PostgreSQL GUI tool
2. Create a new database named: `smart_organizer`
3. Create a new user: username `demo`, password `demo`
4. Grant all privileges on the database to the user

**What this does:** Creates the database and user account that the application will use.

---

## ✅ Step 3: Configure Environment Variables

The `.env` file is already created with default settings. **You can skip this step** if you're using the default `demo/demo` credentials.

If you want to use different credentials, edit `.env`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_organizer
DB_USER=your_username      # Change this
DB_PASSWORD=your_password  # Change this
```

**What this does:** Tells the application how to connect to your database.

---

## ✅ Step 4: Run Database Migrations

This creates the tables in your database:

```bash
cd server
node scripts/migrate.js
```

**Expected Output:**
```
🚀 Starting database migration...

📋 Creating table: employees
   ✓ Dropped existing table (if any)
   ✓ Table created successfully
   ✓ Index created: idx_employees_manager_id
   ✓ Index created: idx_employees_level

📋 Creating table: users
   ✓ Dropped existing table (if any)
   ✓ Table created successfully
   ✓ Index created: idx_users_username

✅ Migration completed successfully!
```

**What this does:** Creates the `employees` and `users` tables based on the schema defined in `server/config/schema.json`.

---

## ✅ Step 5: Seed Sample Data

### 5a. Create Admin User (Required)

```bash
# Still in server directory
node scripts/seed-users.js
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

**What this does:** Creates the admin user account so you can log in.

### 5b. Seed Employee Data (Optional but Recommended)

```bash
node scripts/seed.js
cd ..
```

**What this does:** Adds sample organizational hierarchy data for testing.

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
- **View Tables:** Browse all employees in a data table
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
- **Database Schema:** `server/config/schema.json`
- **Environment Config:** `.env`
- **Migration Script:** `server/scripts/migrate.js`
- **User Seed:** `server/scripts/seed-users.js`
- **Employee Seed:** `server/scripts/seed.js`

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

**Solution:**
```bash
# Grant proper permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"
```

---

## 🔄 Reset Everything

If you need to start fresh:

```bash
# 1. Stop the application (Ctrl+C)

# 2. Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS smart_organizer;"
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# 3. Run migrations again
cd server
node scripts/migrate.js
node scripts/seed-users.js
node scripts/seed.js
cd ..

# 4. Restart application
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
