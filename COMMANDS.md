# Smart - Command Reference

## Installation Commands

### Install All Dependencies
```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

## Database Commands

### PostgreSQL Setup
```bash
# Create database and user
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "CREATE USER demo WITH PASSWORD 'demo';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# Connect to database
psql -U demo -d smart_organizer

# List databases
psql -U postgres -l

# Drop database (if needed)
psql -U postgres -c "DROP DATABASE smart_organizer;"
```

### Migration Commands
```bash
# Run migrations (creates tables from schema.json)
cd server && node scripts/migrate.js && cd ..

# Or using npm script
npm run db:migrate

# Seed admin user (REQUIRED - creates admin/admin login)
cd server && node scripts/seed-users.js && cd ..

# Seed employee sample data (OPTIONAL)
cd server && node scripts/seed.js && cd ..

# Or using npm script
npm run db:seed
```

## Development Commands

### Start Application
```bash
# Start both frontend and backend
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Alternative: Start individually
cd server && npm run dev  # Backend on port 3001
cd client && npm run dev  # Frontend on port 5173
```

### Build Commands
```bash
# Build frontend for production
npm run build

# Preview production build
cd client && npm run preview
```

## Git Commands

### Initial Setup
```bash
# Initialize repository (already done)
git init

# Check status
git status

# Add all files
git add .

# First commit
git commit -m "Initial commit: Smart Personal Organizer with React, PostgreSQL, and hierarchical visualization"

# Rename branch to main (if needed)
git branch -m main

# Add remote repository
git remote add origin <your-repository-url>

# Push to remote
git push -u origin main
```

### Regular Workflow
```bash
# Check what changed
git status

# Add specific files
git add <filename>

# Add all changes
git add .

# Commit changes
git commit -m "Your descriptive message"

# Push to remote
git push

# Pull latest changes
git pull

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

### Useful Git Commands
```bash
# View remote URL
git remote -v

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- <filename>

# View differences
git diff

# Create .gitignore (already created)
# Ensure .env is in .gitignore
```

## Testing API

### Authentication APIs
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Change password
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","currentPassword":"admin","newPassword":"newpass123"}'

# Register new user (ADMIN or USER role)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","role":"USER"}'
```

### Employee APIs
```bash
# Health check
curl http://localhost:3001/api/health

# Get all employees
curl http://localhost:3001/api/employees

# Get hierarchy
curl http://localhost:3001/api/employees/hierarchy

# Get single employee
curl http://localhost:3001/api/employees/1

# Get reportees
curl http://localhost:3001/api/employees/1/reportees

# Create employee
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","designation":"Developer","level":4,"manager_id":4}'

# Update employee
curl -X PUT http://localhost:3001/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"designation":"Senior CEO"}'

# Delete employee
curl -X DELETE http://localhost:3001/api/employees/13
```

## Maintenance Commands

### Clean Install
```bash
# Remove all node_modules
rm -rf node_modules server/node_modules client/node_modules

# Remove package-lock files
rm -f package-lock.json server/package-lock.json client/package-lock.json

# Reinstall
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Database Reset
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS smart_organizer;"
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# Run migrations
cd server && node scripts/migrate.js

# Seed admin user (REQUIRED)
node scripts/seed-users.js

# Seed employee data (OPTIONAL)
node scripts/seed.js
cd ..
```

### View Logs
```bash
# Server logs (if running in background)
# Check terminal where npm run dev is running

# PostgreSQL logs (macOS Homebrew)
tail -f /usr/local/var/log/postgres.log

# PostgreSQL logs (Linux)
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Production Deployment

### Build for Production
```bash
# Build frontend
cd client
npm run build
cd ..

# The build output will be in client/dist/
```

### Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit with production values
nano .env  # or vim .env
```

## Troubleshooting Commands

### Check Ports
```bash
# Check if port 3001 is in use
lsof -i :3001

# Check if port 5173 is in use
lsof -i :5173

# Kill process on port
kill -9 <PID>
```

### PostgreSQL Status
```bash
# macOS (Homebrew)
brew services list
brew services start postgresql
brew services stop postgresql
brew services restart postgresql

# Linux (systemd)
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
```

### Node Version
```bash
# Check Node version (should be 22.x)
node --version

# Check npm version
npm --version
```

## Quick Reference

### Project URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

### Important Files
- `.env` - Environment configuration
- `server/config/schema.json` - Database schema definition
- `README.md` - Full documentation
- `SETUP.md` - Quick setup guide
- `STARTUP-GUIDE.md` - Step-by-step startup instructions

### Default Credentials

**Database:**
- User: demo
- Password: demo
- Database Name: smart_organizer

**Application Login:**
- Username: admin
- Password: admin
- Role: ADMIN

**Remember to change these in production!**
