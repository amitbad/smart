# Database Abstraction Layer - MongoDB & PostgreSQL Support

## Overview
The Smart Personal Organizer now supports **both MongoDB and PostgreSQL** through a unified database abstraction layer. Switch between databases using a single environment variable.

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Database
Edit `server/.env`:

**For MongoDB (Default):**
```env
PORT=5000
DB_TYPE=Mongo
MONGO_URI=mongodb://localhost:27017/smart
JWT_SECRET=your_jwt_secret_key_here
```

**For PostgreSQL:**
```env
PORT=5000
DB_TYPE=Postgres
PG_HOST=localhost
PG_PORT=5533
PG_DATABASE=smart
PG_USER=postgres
PG_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Start Server
```bash
npm run dev
```

The server will automatically connect to the configured database.

## Database Type Options
- `DB_TYPE=Mongo` - Use MongoDB
- `DB_TYPE=Postgres` or `DB_TYPE=PG` - Use PostgreSQL

## MongoDB Setup

### Install MongoDB
**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download from https://www.mongodb.com/try/download/community

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Verify MongoDB Running
```bash
mongosh
```

### Create Initial Admin User (MongoDB)
```javascript
use smart
db.users.insertOne({
  username: "admin",
  password: "$2b$10$YourHashedPasswordHere",  // Use bcrypt to hash
  role: "ADMIN",
  created_at: new Date()
})
```

Or use the provided script:
```bash
node server/scripts/createAdminUser.js
```

## PostgreSQL Setup

### Existing Setup
Your PostgreSQL setup remains unchanged. Run migrations as before:
```bash
node server/scripts/runMigrations.js
```

## Architecture

### Directory Structure
```
server/
├── db/
│   ├── index.js                 # Database factory
│   ├── schemas.js               # MongoDB schemas
│   └── adapters/
│       ├── MongoAdapter.js      # MongoDB implementation
│       └── PostgresAdapter.js   # PostgreSQL implementation
├── config/
│   ├── database.js              # PostgreSQL pool
│   └── mongodb.js               # MongoDB connection
└── routes/
    ├── [existing routes]        # Current PostgreSQL routes
    └── universal/               # Database-agnostic routes
        └── auth.js              # Example universal route
```

### Database Adapter API

Both adapters implement the same interface:

```javascript
// Find all records
await db.findAll(collection, filter, options)

// Find one record
await db.findOne(collection, filter)

// Find by ID
await db.findById(collection, id)

// Create record
await db.create(collection, data)

// Update record
await db.update(collection, id, data)

// Delete record
await db.delete(collection, id)

// Count records
await db.count(collection, filter)

// Raw query (PostgreSQL only)
await db.query(sql, params)
```

### MongoDB Collections
- `users` - User accounts
- `designations` - Job designations
- `departments` - Departments
- `projects` - Projects
- `members` - Team members
- `actionItems` - Action items/tasks
- `emails` - Email tracking
- `bench` - Bench management

### MongoDB Schemas
All schemas are defined in `server/db/schemas.js` with:
- Proper field types
- Required validations
- Enum constraints
- References (foreign keys)
- Timestamps

## Migration Guide

### Converting Routes to Universal

**Old (PostgreSQL-only):**
```javascript
import pool from '../config/database.js';

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM designations');
  res.json(result.rows);
});
```

**New (Universal):**
```javascript
import { getDB } from '../db/index.js';

router.get('/', async (req, res) => {
  const db = getDB();
  const designations = await db.findAll('designations', {}, { sort: { name: 1 } });
  res.json(designations);
});
```

### Handling IDs
MongoDB uses `_id` (ObjectId), PostgreSQL uses `id` (integer).

**Universal approach:**
```javascript
const userId = user.id || user._id;
```

## Current Status

### ✅ Completed
- Database abstraction layer
- MongoDB adapter
- PostgreSQL adapter
- Database factory with auto-initialization
- MongoDB schemas for all collections
- Universal auth routes
- Environment configuration
- Package dependencies

### ⚠️ Pending
- Convert remaining routes to universal format
- Create MongoDB initialization script
- Add database migration utilities
- Update all route files

## Testing

### Test MongoDB Connection
```bash
curl http://localhost:5000/api/health
```

Response should show:
```json
{
  "status": "ok",
  "message": "Smart API is running",
  "database": "Mongo"
}
```

### Test PostgreSQL Connection
Change `DB_TYPE=Postgres` in `.env`, restart server, and test again.

## Performance Considerations

### MongoDB
- Automatic indexing on `_id`
- Add custom indexes in schemas for frequently queried fields
- Use aggregation pipelines for complex queries

### PostgreSQL
- Existing indexes from migrations
- Connection pooling via pg.Pool
- Prepared statements for security

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# Check connection string
echo $MONGO_URI
```

### PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost -p 5533 -d smart

# Verify credentials in .env
```

### Mixed Database Errors
Ensure only one `DB_TYPE` is set and server is restarted after changes.

## Next Steps

1. **Install dependencies:** `npm install`
2. **Configure .env:** Set `DB_TYPE=Mongo`
3. **Start MongoDB:** `brew services start mongodb-community` (macOS)
4. **Run server:** `npm run dev`
5. **Create admin user:** Use provided script or manually
6. **Test API:** Visit http://localhost:5000/api/health

## Support

For issues or questions:
1. Check logs in terminal
2. Verify database is running
3. Confirm .env configuration
4. Test with `/api/health` endpoint
