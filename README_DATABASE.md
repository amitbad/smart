# Smart Personal Organizer - Database Support

## 🎉 Now Supports Both MongoDB and PostgreSQL!

Switch between databases with a single environment variable: `DB_TYPE`

## Quick Start

### MongoDB (Default) - 5 Minutes

```bash
# Install MongoDB
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Setup
cd server
npm install
cp .env.example .env
npm run init:mongo
npm run dev
```

**Login:** admin / admin123

### PostgreSQL - Use Existing Setup

```bash
# Edit server/.env
DB_TYPE=Postgres

# Run server
npm run dev
```

## Documentation

📖 **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes

📖 **[SETUP_MONGODB.md](./SETUP_MONGODB.md)** - Complete MongoDB guide

📖 **[DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)** - Technical architecture

📖 **[DATABASE_OVERHAUL_SUMMARY.md](./DATABASE_OVERHAUL_SUMMARY.md)** - What changed

## Configuration

Edit `server/.env`:

```env
# MongoDB (Default)
DB_TYPE=Mongo
MONGO_URI=mongodb://localhost:27017/smart

# OR PostgreSQL
DB_TYPE=Postgres
PG_HOST=localhost
PG_PORT=5533
PG_DATABASE=smart
PG_USER=postgres
PG_PASSWORD=your_password
```

## Features

✅ Unified database abstraction layer
✅ Switch databases instantly
✅ No code changes required
✅ MongoDB schemas for all collections
✅ PostgreSQL migrations preserved
✅ Auto-initialization scripts
✅ Comprehensive documentation

## Health Check

```bash
curl http://localhost:5000/api/health
```

Response shows which database is active:
```json
{
  "status": "ok",
  "message": "Smart API is running",
  "database": "Mongo"
}
```

## Support

- MongoDB issues → See [SETUP_MONGODB.md](./SETUP_MONGODB.md)
- PostgreSQL issues → Use existing setup
- Architecture questions → See [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)
- Quick help → See [QUICK_START.md](./QUICK_START.md)

## Default Database

**MongoDB** is now the default database. To use PostgreSQL, simply change `DB_TYPE=Postgres` in your `.env` file.

Happy organizing! 🚀
