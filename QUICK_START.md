# Quick Start - MongoDB Setup (Default)

## 1. Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:** Download from https://www.mongodb.com/try/download/community

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## 2. Install Dependencies

```bash
cd server
npm install
```

## 3. Configure Environment

The `.env.example` file is already configured for MongoDB. Copy it:

```bash
cp .env.example .env
```

Default configuration:
```env
PORT=5000
DB_TYPE=Mongo
MONGO_URI=mongodb://localhost:27017/smart
JWT_SECRET=your_jwt_secret_key_here
```

## 4. Initialize Database

```bash
npm run init:mongo
```

This creates an admin user:
- Username: `admin`
- Password: `admin123`

## 5. Start Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB adapter initialized
🚀 Server running on http://localhost:5000
💾 Database: Mongo
```

## 6. Start Client

```bash
cd ../client
npm install
npm run dev
```

## 7. Login

Open http://localhost:5173 and login with:
- Username: `admin`
- Password: `admin123`

**⚠️ Change password immediately after first login!**

## Switch to PostgreSQL

If you prefer PostgreSQL:

1. Edit `server/.env`:
   ```env
   DB_TYPE=Postgres
   PG_HOST=localhost
   PG_PORT=5533
   PG_DATABASE=smart
   PG_USER=postgres
   PG_PASSWORD=your_password
   ```

2. Run migrations:
   ```bash
   npm run migrate:pg
   ```

3. Restart server:
   ```bash
   npm run dev
   ```

## Verify Setup

Test the API:
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Smart API is running",
  "database": "Mongo"
}
```

## Troubleshooting

**MongoDB not starting:**
```bash
# macOS
brew services restart mongodb-community

# Linux
sudo systemctl restart mongod

# Windows
# Open Services → MongoDB Server → Start
```

**Connection refused:**
```bash
# Verify MongoDB is running
mongosh
```

**Dependencies error:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read `SETUP_MONGODB.md` for detailed MongoDB guide
- Read `DATABASE_MIGRATION.md` for architecture details
- Start building your team hierarchy!

That's it! You're ready to use Smart Personal Organizer with MongoDB! 🎉
