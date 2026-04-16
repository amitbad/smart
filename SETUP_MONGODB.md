# MongoDB Setup Guide for Smart Personal Organizer

## Quick Setup (5 minutes)

### Step 1: Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer (choose "Complete" installation)
3. MongoDB will start automatically as a service

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 2: Verify MongoDB is Running

```bash
# Test connection
mongosh

# You should see MongoDB shell
# Type 'exit' to quit
```

### Step 3: Configure Environment

Create or update `server/.env`:

```env
PORT=5000
DB_TYPE=Mongo
MONGO_URI=mongodb://localhost:27017/smart
JWT_SECRET=your_super_secret_jwt_key_change_this
```

### Step 4: Install Node Dependencies

```bash
cd server
npm install
```

This will install:
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- Other existing dependencies

### Step 5: Initialize MongoDB Database

```bash
npm run init:mongo
```

This creates:
- Database: `smart`
- Admin user with credentials:
  - Username: `admin`
  - Password: `admin123`
  - ⚠️ **Change this password after first login!**

### Step 6: Start the Server

```bash
npm run dev
```

You should see:
```
🔧 Initializing database: Mongo
MongoDB connected successfully
✅ MongoDB adapter initialized
🚀 Server running on http://localhost:5000
📊 API available at http://localhost:5000/api
💾 Database: Mongo
```

### Step 7: Test the API

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Smart API is running",
  "database": "Mongo"
}
```

### Step 8: Login to Frontend

1. Start the client: `cd client && npm run dev`
2. Open http://localhost:5173
3. Login with:
   - Username: `admin`
   - Password: `admin123`
4. Go to Settings → Change Password immediately!

## MongoDB vs PostgreSQL

### When to Use MongoDB
✅ Flexible schema requirements
✅ Rapid prototyping
✅ Document-oriented data
✅ Horizontal scaling needs
✅ JSON-like data structures

### When to Use PostgreSQL
✅ Complex relationships
✅ ACID transactions critical
✅ Existing SQL expertise
✅ Strict data integrity
✅ Advanced querying (JOINs, CTEs)

## Switching Between Databases

### Switch to MongoDB
1. Edit `server/.env`: `DB_TYPE=Mongo`
2. Restart server: `npm run dev`

### Switch to PostgreSQL
1. Edit `server/.env`: `DB_TYPE=Postgres`
2. Ensure PostgreSQL is running
3. Run migrations if needed: `npm run migrate:pg`
4. Restart server: `npm run dev`

## MongoDB Collections

The system creates these collections automatically:

| Collection | Description |
|------------|-------------|
| `users` | User accounts and authentication |
| `designations` | Job titles/roles |
| `departments` | Organizational departments |
| `projects` | Project records |
| `members` | Team members/employees |
| `actionitems` | Tasks and action items |
| `emails` | Email tracking |
| `benches` | Bench management records |

## MongoDB Shell Commands

### Connect to Database
```bash
mongosh
use smart
```

### View Collections
```javascript
show collections
```

### Count Documents
```javascript
db.users.countDocuments()
db.members.countDocuments()
```

### Find All Users
```javascript
db.users.find().pretty()
```

### Find Specific User
```javascript
db.users.findOne({ username: "admin" })
```

### Update User Role
```javascript
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "ADMIN" } }
)
```

### Delete a Record
```javascript
db.actionitems.deleteOne({ _id: ObjectId("...") })
```

### Create Index
```javascript
db.members.createIndex({ email: 1 }, { unique: true })
```

## Backup & Restore

### Backup Database
```bash
mongodump --db smart --out ./backup
```

### Restore Database
```bash
mongorestore --db smart ./backup/smart
```

### Export Collection to JSON
```bash
mongoexport --db smart --collection users --out users.json --pretty
```

### Import Collection from JSON
```bash
mongoimport --db smart --collection users --file users.json
```

## Troubleshooting

### MongoDB Not Starting (macOS)
```bash
# Check status
brew services list

# Restart service
brew services restart mongodb-community

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### MongoDB Not Starting (Windows)
1. Open Services (Win+R → `services.msc`)
2. Find "MongoDB Server"
3. Right-click → Start
4. Check logs in: `C:\Program Files\MongoDB\Server\7.0\log\`

### MongoDB Not Starting (Linux)
```bash
# Check status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod

# Check logs
sudo journalctl -u mongod
```

### Connection Refused
```bash
# Verify MongoDB is listening
netstat -an | grep 27017

# Check firewall (Linux)
sudo ufw allow 27017

# Test connection
mongosh --host localhost --port 27017
```

### Authentication Failed
If you enabled auth:
```javascript
// In mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["root"]
})
```

Update `.env`:
```env
MONGO_URI=mongodb://admin:password@localhost:27017/smart?authSource=admin
```

### Database Not Found
MongoDB creates databases on first write. Just start using it:
```bash
npm run init:mongo
```

## Performance Tips

### Add Indexes
```javascript
// In mongosh
use smart

// Index on email for faster lookups
db.members.createIndex({ email: 1 }, { unique: true })

// Index on action_date for action items
db.actionitems.createIndex({ action_date: 1 })

// Compound index for bench queries
db.benches.createIndex({ member_id: 1, status: 1 })
```

### Monitor Performance
```javascript
// Show current operations
db.currentOp()

// Show database stats
db.stats()

// Show collection stats
db.members.stats()
```

## Security Best Practices

### 1. Change Default Password
After first login, immediately change the admin password.

### 2. Use Strong JWT Secret
In `.env`, use a long random string:
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Enable MongoDB Authentication (Production)
```javascript
// In mongosh
use admin
db.createUser({
  user: "smartapp",
  pwd: "strong_password_here",
  roles: [{ role: "readWrite", db: "smart" }]
})
```

Update `.env`:
```env
MONGO_URI=mongodb://smartapp:strong_password_here@localhost:27017/smart
```

### 4. Restrict Network Access
Edit `/etc/mongod.conf` (Linux) or `/usr/local/etc/mongod.conf` (macOS):
```yaml
net:
  bindIp: 127.0.0.1  # Only localhost
```

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Database initialized with admin user
3. ✅ Server connected to MongoDB
4. ✅ Frontend can login

Now you can:
- Add team members
- Create action items
- Track emails
- Manage bench assignments
- All data stored in MongoDB!

## Support

If you encounter issues:
1. Check MongoDB is running: `mongosh`
2. Verify `.env` configuration
3. Check server logs for errors
4. Test with `/api/health` endpoint
5. Review MongoDB logs

For switching back to PostgreSQL, just change `DB_TYPE=Postgres` in `.env` and restart.
