# Database Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│                  (client/src/pages/*)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Server                            │
│                   (server/server.js)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Abstraction Layer                     │
│                   (db/index.js)                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DB_TYPE from .env                                   │  │
│  │  ├─ "Mongo" → MongoAdapter                          │  │
│  │  └─ "Postgres" or "PG" → PostgresAdapter            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────┬─────────────────────────┘
             │                      │
             ▼                      ▼
    ┌────────────────┐    ┌────────────────────┐
    │  MongoAdapter  │    │  PostgresAdapter   │
    │ (Mongoose ODM) │    │   (pg Pool)        │
    └────────┬───────┘    └────────┬───────────┘
             │                      │
             ▼                      ▼
    ┌────────────────┐    ┌────────────────────┐
    │    MongoDB     │    │    PostgreSQL      │
    │  localhost:    │    │   localhost:       │
    │     27017      │    │      5533          │
    └────────────────┘    └────────────────────┘
```

## Database Adapter Interface

Both adapters implement the same methods:

```javascript
class DatabaseAdapter {
  // CRUD Operations
  async findAll(collection, filter, options)
  async findOne(collection, filter)
  async findById(collection, id)
  async create(collection, data)
  async update(collection, id, data)
  async delete(collection, id)
  async count(collection, filter)
  
  // Special
  async query(sql, params)  // PostgreSQL only
  async aggregate(pipeline)  // MongoDB only
}
```

## Data Flow

### Example: Fetch All Members

```
User clicks "Members" in UI
         ↓
React sends GET /api/members
         ↓
Express routes/members.js
         ↓
const db = getDB()
         ↓
db.findAll('members', {}, { sort: { name: 1 } })
         ↓
    ┌────────┴────────┐
    ▼                 ▼
MongoAdapter    PostgresAdapter
    │                 │
    ▼                 ▼
members.find()   SELECT * FROM members
    │                 │
    ▼                 ▼
  MongoDB         PostgreSQL
    │                 │
    └────────┬────────┘
             ▼
    JSON Array of Members
             ↓
    Response to React
             ↓
    Display in UI
```

## Collections/Tables Mapping

| MongoDB Collection | PostgreSQL Table | Purpose |
|-------------------|------------------|---------|
| users | users | Authentication |
| designations | designations | Job titles |
| departments | departments | Org structure |
| projects | projects | Project tracking |
| members | members | Team members |
| actionitems | action_items | Tasks |
| emails | emails | Email tracking |
| benches | bench | Bench management |

## ID Handling

### MongoDB
- Uses `_id` field (ObjectId)
- Example: `_id: ObjectId("507f1f77bcf86cd799439011")`

### PostgreSQL
- Uses `id` field (integer, auto-increment)
- Example: `id: 42`

### Universal Approach
```javascript
const userId = user.id || user._id;
```

## Schema Definitions

### MongoDB (Mongoose)
```javascript
// db/schemas.js
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  created_at: { type: Date, default: Date.now }
});
```

### PostgreSQL (SQL)
```sql
-- migrations/003_members.sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  designation_id INTEGER REFERENCES designations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration Flow

```
.env file
   │
   ├─ DB_TYPE=Mongo
   │     │
   │     ├─ MONGO_URI=mongodb://localhost:27017/smart
   │     │
   │     └─ Loads MongoAdapter
   │           │
   │           └─ Connects to MongoDB
   │
   └─ DB_TYPE=Postgres
         │
         ├─ PG_HOST=localhost
         ├─ PG_PORT=5533
         ├─ PG_DATABASE=smart
         ├─ PG_USER=postgres
         ├─ PG_PASSWORD=***
         │
         └─ Loads PostgresAdapter
               │
               └─ Creates pg.Pool connection
```

## Initialization Sequence

```
1. Server starts (node server.js)
        ↓
2. Load environment (.env)
        ↓
3. Read DB_TYPE
        ↓
4. initializeDatabase()
        ↓
    ┌───┴───┐
    ▼       ▼
  Mongo   Postgres
    │       │
    ▼       ▼
Connect  Create Pool
    │       │
    └───┬───┘
        ↓
5. Create adapter instance
        ↓
6. Start Express server
        ↓
7. Ready to handle requests
```

## Route Conversion Example

### Before (PostgreSQL only)
```javascript
import pool from '../config/database.js';

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

### After (Universal)
```javascript
import { getDB } from '../db/index.js';

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const members = await db.findAll(
      'members',
      {},
      { sort: { name: 1 } }
    );
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

## Error Handling

### MongoDB Errors
- Connection: `MongoServerError`
- Validation: `ValidationError`
- Duplicate: `E11000 duplicate key error`

### PostgreSQL Errors
- Connection: `ECONNREFUSED`
- Constraint: `error.code === '23505'`
- Not found: `result.rows.length === 0`

### Universal Handling
```javascript
try {
  const db = getDB();
  await db.create('members', data);
} catch (error) {
  if (error.code === 11000 || error.code === '23505') {
    // Duplicate key in either database
    res.status(409).json({ error: 'Already exists' });
  } else {
    res.status(500).json({ error: 'Failed' });
  }
}
```

## Performance Considerations

### MongoDB
- Automatic indexing on `_id`
- Add indexes in schemas: `email: { type: String, index: true }`
- Use aggregation for complex queries
- Horizontal scaling with sharding

### PostgreSQL
- Indexes from migrations
- Connection pooling (pg.Pool)
- Prepared statements
- Vertical scaling, read replicas

## Security

### MongoDB
- No authentication by default (local dev)
- Enable auth for production
- Use connection string with credentials

### PostgreSQL
- Password authentication required
- Role-based access control
- SSL connections for production

## Backup & Migration

### MongoDB
```bash
# Backup
mongodump --db smart --out ./backup

# Restore
mongorestore --db smart ./backup/smart

# Export to JSON
mongoexport --db smart --collection members --out members.json
```

### PostgreSQL
```bash
# Backup
pg_dump -U postgres -h localhost -p 5533 smart > backup.sql

# Restore
psql -U postgres -h localhost -p 5533 smart < backup.sql
```

## Development Workflow

### Using MongoDB
```bash
# 1. Set environment
echo "DB_TYPE=Mongo" > server/.env

# 2. Start MongoDB
brew services start mongodb-community

# 3. Initialize
npm run init:mongo

# 4. Develop
npm run dev
```

### Using PostgreSQL
```bash
# 1. Set environment
echo "DB_TYPE=Postgres" > server/.env

# 2. Run migrations
npm run migrate:pg

# 3. Develop
npm run dev
```

### Switching Databases
```bash
# Change .env
sed -i '' 's/DB_TYPE=Mongo/DB_TYPE=Postgres/' server/.env

# Restart server
npm run dev
```

## Testing Strategy

### Unit Tests
```javascript
import { getDB } from '../db/index.js';

describe('Database Adapter', () => {
  it('should create a member', async () => {
    const db = getDB();
    const member = await db.create('members', {
      name: 'Test User',
      email: 'test@example.com'
    });
    expect(member).toHaveProperty('name', 'Test User');
  });
});
```

### Integration Tests
Run tests against both databases:
```bash
# Test MongoDB
DB_TYPE=Mongo npm test

# Test PostgreSQL
DB_TYPE=Postgres npm test
```

## Future Enhancements

### Potential Additions
- MySQL adapter
- SQLite adapter (for embedded use)
- Redis adapter (for caching)
- Multi-database support (read from Mongo, write to Postgres)
- Automatic data sync between databases
- GraphQL layer on top of adapters

### Migration Tools
- Data migration script (Postgres → Mongo)
- Schema comparison tool
- Automated testing across databases

## Summary

This architecture provides:
✅ **Flexibility** - Switch databases easily
✅ **Consistency** - Same API for all databases
✅ **Scalability** - Choose DB based on needs
✅ **Maintainability** - Single codebase
✅ **Future-proof** - Easy to add new databases
