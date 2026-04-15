# ⚡ Quick Start - Smart Personal Organizer

## 🎯 Follow This Document to Get Started!

This is your **main guide**. Follow these steps in order.

---

## 📋 Prerequisites Check

Before starting, verify you have:
- ✅ Node.js 22.x installed (`node --version`)
- ✅ PostgreSQL installed and running
- ✅ Terminal/Command prompt access

---

## 🚀 5-Step Setup Process

### Step 1: Install Dependencies (2-3 minutes)

```bash
# From project root
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Step 2: Setup Database (1 minute)

```bash
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "CREATE USER demo WITH PASSWORD 'demo';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"
```

### Step 3: Create Tables (30 seconds)

```bash
cd server
node scripts/migrate.js
```

You should see:
```
✅ Migration completed successfully!
```

### Step 4: Create Admin User (30 seconds)

```bash
node scripts/seed-users.js
```

You should see:
```
✓ Admin user created successfully
Username: admin
Password: admin
```

### Step 5: (Optional) Add Sample Data

```bash
node scripts/seed.js
cd ..
```

---

## ▶️ Start the Application

```bash
# From project root
npm run dev
```

Wait for:
```
🚀 Server running on http://localhost:3001
➜  Local:   http://localhost:5173/
```

---

## 🌐 Access the Application

1. Open browser: **http://localhost:5173**
2. Login with:
   - Username: `admin`
   - Password: `admin`

---

## ✅ What You Can Do Now

After logging in:

1. **View Hierarchy** - See organizational chart
2. **View Tables** - Browse employee data
3. **Change Password** - Update your password (recommended!)
4. **Add Data** - Start adding your own employees
5. **Logout** - Sign out when done

---

## 📚 Need More Help?

- **Detailed Steps:** Read `STARTUP-GUIDE.md`
- **All Commands:** Check `COMMANDS.md`
- **Full Documentation:** See `README.md`
- **Troubleshooting:** See below

---

## 🔧 Common Issues

### PostgreSQL not running?
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Port already in use?
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Migration failed?
```bash
# Reset database
psql -U postgres -c "DROP DATABASE smart_organizer;"
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# Try migration again
cd server && node scripts/migrate.js
```

---

## 🎉 Success Checklist

- ✅ Dependencies installed
- ✅ Database created
- ✅ Tables migrated
- ✅ Admin user created
- ✅ Application running
- ✅ Logged in successfully

---

## 🔐 Security Reminder

**Change the default password!**
1. Login with admin/admin
2. Click "Change Password" in sidebar
3. Update to a secure password

---

## 📊 Database Schema

Your database now has:

**users table:**
- id, username, password (hashed), role (ADMIN/USER)

**employees table:**
- id, name, email, designation, level, manager_id

To add more tables, edit `server/config/schema.json` and run migration again.

---

**You're all set! Start organizing your data! 🎯**
