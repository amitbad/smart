# Action Items - Reference Link Feature

## Overview
Added an optional **Reference Link** field to Action Items that stores encrypted URLs. This field works with both MongoDB and PostgreSQL databases.

---

## ✨ Feature Details

### What's New
- **Field Name**: `reference_link`
- **Type**: URL (optional)
- **Purpose**: Store reference URLs related to action items (e.g., documentation, tickets, resources)
- **Security**: URLs are encrypted before storing in database using AES-256-GCM
- **Database Support**: ✅ MongoDB | ✅ PostgreSQL

---

## 🔐 Encryption

### How It Works
1. **User enters URL** in the Action Items form
2. **Backend encrypts** the URL before storing in database
3. **Database stores** encrypted gibberish (unreadable)
4. **Backend decrypts** when retrieving data
5. **User sees** the original URL in the application

### Example
```javascript
// User Input
"https://jira.company.com/browse/PROJ-123"

// Stored in Database (encrypted)
"c3d4e5f6a7b8:9a0b1c2d3e4f5a6b:7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f"

// Displayed to User (decrypted)
"https://jira.company.com/browse/PROJ-123"
```

---

## 📋 Implementation Details

### Backend Changes

#### 1. MongoDB Schema (`server/db/schemas.js`)
```javascript
const actionItemSchema = new mongoose.Schema({
  action_date: { type: Date, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: [...], default: 'Medium' },
  status: { type: String, enum: [...], default: 'Pending' },
  dependency_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  reference_link: { type: String, default: null },  // ← NEW FIELD
  created_at: { type: Date, default: Date.now }
});
```

#### 2. API Routes (`server/routes/actionItems.js`)

**Encryption on CREATE (POST):**
```javascript
const encryptedLink = reference_link ? encryptUrl(reference_link) : null;
const newItem = await db.create('actionItems', {
  // ... other fields
  reference_link: encryptedLink
});
```

**Encryption on UPDATE (PUT):**
```javascript
if (reference_link !== undefined) {
  updateData.reference_link = reference_link ? encryptUrl(reference_link) : null;
}
```

**Decryption on GET:**
```javascript
const decryptedItems = actionItems.map(item => ({
  ...item,
  reference_link: item.reference_link ? decryptUrl(item.reference_link) : null
}));
```

#### 3. PostgreSQL Migration
**File**: `server/migrations/add_reference_link_to_action_items.sql`

```sql
ALTER TABLE action_items 
ADD COLUMN IF NOT EXISTS reference_link TEXT DEFAULT NULL;
```

**To run migration:**
```bash
psql -U your_user -d your_database -f server/migrations/add_reference_link_to_action_items.sql
```

---

### Frontend Changes

#### 1. Form State (`client/src/pages/ActionItems.jsx`)
```javascript
const [form, setForm] = useState({
  action_date: today,
  description: '',
  priority: 'Medium',
  status: 'Not Started',
  dependency_member_ids: [],
  reference_link: ''  // ← NEW FIELD
});
```

#### 2. UI Input Field
```jsx
<div>
  <label className="block text-sm mb-1">Reference Link (optional)</label>
  <input 
    type="url" 
    value={form.reference_link} 
    onChange={(e) => setForm(f => ({ ...f, reference_link: e.target.value }))} 
    className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm" 
    placeholder="https://example.com/reference" 
  />
</div>
```

#### 3. API Payload
```javascript
const payload = {
  action_date: form.action_date,
  description: form.description,
  priority: form.priority,
  status: form.status,
  dependency_member_id: form.dependency_member_ids?.[0] || null,
  reference_link: form.reference_link || null  // ← NEW FIELD
};
```

---

## 🚀 Usage

### Adding an Action Item with Reference Link

1. **Navigate** to Action Items page
2. **Click** "Add Action Item" button
3. **Fill in** required fields:
   - Date
   - Action Item description
   - Priority
   - Status
4. **Optionally add** Reference Link:
   - Enter URL (e.g., `https://docs.company.com/guide`)
5. **Click** "Add"

### Editing Reference Link

1. **Click** edit icon on any action item
2. **Update** the Reference Link field
3. **Click** "Update"

### Viewing Reference Link

- Reference links are displayed in the action item details
- Click the link to open in a new tab (if implemented in UI)

---

## 🔒 Security Features

### Encryption Details
- **Algorithm**: AES-256-GCM
- **Key**: Stored in `ENCRYPTION_KEY` environment variable
- **Unique IV**: Each encrypted URL has a unique initialization vector
- **Tamper-proof**: GCM mode provides authentication

### What's Protected
✅ **Database breach**: URLs remain encrypted  
✅ **Backup theft**: Backups contain encrypted URLs  
✅ **Direct queries**: `SELECT * FROM action_items` shows encrypted data  
✅ **Insider threat**: DBAs cannot read URLs without encryption key  

### Database Examples

**MongoDB Query:**
```javascript
db.actionItems.findOne()
// Output:
{
  "_id": ObjectId("..."),
  "description": "Review security documentation",
  "reference_link": "a1b2c3d4:e5f6a7b8:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
  // ... other fields
}
```

**PostgreSQL Query:**
```sql
SELECT description, reference_link FROM action_items LIMIT 1;
-- Output:
-- description                      | reference_link
-- Review security documentation    | a1b2c3d4:e5f6a7b8:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4
```

---

## 📝 Database Setup

### For MongoDB
✅ **No migration needed** - Schema automatically updated on restart

### For PostgreSQL
⚠️ **Migration required** - Run the SQL migration:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d smart_organizer

# Run migration
\i server/migrations/add_reference_link_to_action_items.sql

# Verify column was added
\d action_items
```

**Or using command line:**
```bash
psql -U postgres -d smart_organizer -f server/migrations/add_reference_link_to_action_items.sql
```

---

## 🧪 Testing

### Test Encryption is Working

1. **Add action item with reference link:**
   ```
   POST /api/action-items
   {
     "action_date": "2026-04-16",
     "description": "Test action",
     "priority": "Medium",
     "status": "Not Started",
     "reference_link": "https://test.example.com/secret"
   }
   ```

2. **Query database directly:**
   
   **MongoDB:**
   ```javascript
   db.actionItems.findOne({ description: "Test action" })
   ```
   
   **PostgreSQL:**
   ```sql
   SELECT * FROM action_items WHERE description = 'Test action';
   ```
   
   **Expected**: `reference_link` shows encrypted string, NOT the original URL

3. **View in application:**
   - Open Action Items page
   - Edit the test action item
   - Reference Link field shows: `https://test.example.com/secret`

---

## 🔧 Troubleshooting

### Issue: "Decryption failed" error

**Cause**: ENCRYPTION_KEY not set or incorrect

**Solution:**
```bash
# In server/.env
ENCRYPTION_KEY=your_64_character_hex_key_here
```

### Issue: Reference link not saving

**Cause**: Database column not created (PostgreSQL only)

**Solution:**
```bash
# Run the migration
psql -U postgres -d smart_organizer -f server/migrations/add_reference_link_to_action_items.sql
```

### Issue: Old action items don't have reference link field

**Expected behavior**: Old records will have `reference_link: null`

**Solution**: No action needed - field is optional

---

## 📊 API Endpoints

### GET /api/action-items
**Response includes decrypted reference_link:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "action_date": "2026-04-16",
    "description": "Review documentation",
    "priority": "High",
    "status": "In Progress",
    "reference_link": "https://docs.company.com/guide",
    "created_at": "2026-04-16T10:00:00Z"
  }
]
```

### POST /api/action-items
**Request body:**
```json
{
  "action_date": "2026-04-16",
  "description": "New action",
  "priority": "Medium",
  "status": "Not Started",
  "reference_link": "https://example.com/ref"
}
```

### PUT /api/action-items/:id
**Request body (partial update):**
```json
{
  "reference_link": "https://updated-link.com"
}
```

---

## 🎯 Summary

### What Was Added
✅ Optional `reference_link` field to Action Items  
✅ AES-256-GCM encryption for URLs  
✅ Support for both MongoDB and PostgreSQL  
✅ UI input field in add/edit modal  
✅ Automatic encryption on save  
✅ Automatic decryption on retrieve  

### Files Modified
- `server/db/schemas.js` - Added field to MongoDB schema
- `server/routes/actionItems.js` - Added encryption/decryption logic
- `client/src/pages/ActionItems.jsx` - Added UI field and form handling
- `server/migrations/add_reference_link_to_action_items.sql` - PostgreSQL migration

### Security
🔒 **Reference links are encrypted in database**  
🔒 **Direct database queries show encrypted data**  
🔒 **Decryption happens only in application server**  
🔒 **Uses same ENCRYPTION_KEY as other encrypted fields**  

---

## 📚 Related Documentation
- **Encryption Summary**: `ENCRYPTION_SUMMARY.md`
- **Security Setup**: `SECURITY_SETUP.md`
- **All Routes**: `ALL_ROUTES_CONVERTED.md`

---

**Feature Status**: ✅ Complete and Ready to Use  
**Last Updated**: April 16, 2026
