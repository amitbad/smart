# Quick Setup Guide

## Step-by-Step Setup

### 1. Install All Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Database
```bash
# Update .env file with your PostgreSQL credentials
# Default is demo/demo - change if needed
```

### 3. Create PostgreSQL Database
```bash
# Option 1: Using psql command line
psql -U postgres -c "CREATE DATABASE smart_organizer;"
psql -U postgres -c "CREATE USER demo WITH PASSWORD 'demo';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_organizer TO demo;"

# Option 2: Using PostgreSQL GUI (pgAdmin, DBeaver, etc.)
# - Create database: smart_organizer
# - Create user: demo/demo
# - Grant all privileges
```

### 4. Run Migrations
```bash
cd server
node scripts/migrate.js
```

### 5. Seed Sample Data (Optional)
```bash
node scripts/seed.js
cd ..
```

### 6. Start Application
```bash
# From root directory
npm run dev
```

### 7. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Troubleshooting

### PostgreSQL Not Running
```bash
# macOS (Homebrew)
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Check status
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Port Conflicts
If ports 3001 or 5173 are in use:
- Update `PORT` in `.env` for backend
- Update `server.port` in `client/vite.config.js` for frontend

### Database Connection Error
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Ensure database exists: `psql -U postgres -l`
4. Test connection: `psql -U demo -d smart_organizer`

## Git Commands

### Initialize and First Commit
```bash
git init
git add .
git commit -m "Initial commit: Smart Personal Organizer"
```

### Add Remote and Push
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

### Regular Commits
```bash
git add .
git commit -m "Your message"
git push
```
