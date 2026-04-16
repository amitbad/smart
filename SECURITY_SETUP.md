# 🔐 Security Implementation Guide

## Overview

Your application now has **AES-256-GCM encryption** for sensitive data stored in MongoDB Atlas.

## What's Encrypted

### 1. **Important Links**
- ✅ **Link URLs** - Fully encrypted in database
- ✅ Decrypted automatically when displayed to users

### 2. **Emails**
- ✅ **Email domains** - Only domain part encrypted (e.g., `user@[encrypted_domain]`)
- ✅ Username remains searchable
- ✅ Full email visible to authorized users only

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Laptop (Local)                       │
│  ┌────────────┐         ┌──────────────┐                   │
│  │   Client   │ ◄─────► │    Server    │                   │
│  │  (React)   │  HTTPS  │  (Express)   │                   │
│  └────────────┘         └──────┬───────┘                   │
│                                 │                            │
│                          Encrypt/Decrypt                     │
│                          (AES-256-GCM)                       │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  │
                            TLS/SSL (Encrypted)
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   MongoDB Atlas (Cloud)   │
                    │  ┌────────────────────┐  │
                    │  │ Encrypted Data     │  │
                    │  │ (Useless if stolen)│  │
                    │  └────────────────────┘  │
                    │  + Encryption at Rest    │
                    │  + Network Encryption    │
                    └──────────────────────────┘
```

## Setup Instructions

### Step 1: Generate Encryption Key

Run this command to generate a secure random key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 2: Add to Environment File

Edit `server/.env` and add your encryption key:

```env
DB_TYPE=Mongo
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart?retryWrites=true&w=majority
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

⚠️ **IMPORTANT:**
- **Never commit `.env` to Git** (already in `.gitignore`)
- **Keep this key secret** - it's like your master password
- **Backup this key** - if lost, encrypted data cannot be recovered
- **Use different keys** for development and production

### Step 3: Restart Server

```bash
npm run dev
```

You should see:
```
🔧 Initializing database: Mongo
MongoDB connected successfully
✅ MongoDB adapter initialized
```

## How It Works

### Encryption Process (Saving Data)

```javascript
// User enters: https://example.com/secret
// ↓
// Server encrypts: "iv:authTag:encryptedData"
// ↓
// MongoDB stores: "a1b2c3:d4e5f6:g7h8i9..."
```

### Decryption Process (Retrieving Data)

```javascript
// MongoDB returns: "a1b2c3:d4e5f6:g7h8i9..."
// ↓
// Server decrypts: https://example.com/secret
// ↓
// Client displays: https://example.com/secret
```

## What Happens If...

### ❌ Database is Hacked
- **Attacker gets:** Encrypted gibberish
- **Attacker needs:** Your encryption key (stored only on your laptop)
- **Result:** Data is useless without the key ✅

### ❌ Network is Intercepted
- **Protection:** HTTPS + TLS encryption
- **MongoDB Atlas:** Always uses encrypted connections
- **Result:** Data safe in transit ✅

### ❌ Encryption Key is Lost
- **Problem:** Cannot decrypt existing data
- **Solution:** Keep backup of your `.env` file in a secure location
- **Prevention:** Store key in password manager (1Password, LastPass, etc.)

### ❌ Someone Accesses Your Laptop
- **Risk:** They can access the server and encryption key
- **Mitigation:** 
  - Use laptop password/encryption (FileVault on Mac)
  - Don't leave laptop unlocked
  - Use application-level authentication

## Security Best Practices

### ✅ DO:
1. **Use strong encryption key** (generated randomly, 64 characters)
2. **Backup your `.env` file** securely
3. **Use HTTPS** in production
4. **Enable MongoDB Atlas IP whitelist**
5. **Use strong MongoDB passwords**
6. **Keep server updated** (`npm update`)
7. **Use different keys** for dev/prod

### ❌ DON'T:
1. **Commit `.env` to Git**
2. **Share encryption key** via email/chat
3. **Use simple/guessable keys**
4. **Reuse keys** across projects
5. **Store keys in code**
6. **Disable HTTPS** in production

## Testing Encryption

### Test 1: Create a Link

```bash
# Create link with URL
POST /api/important-links
{
  "link_name": "Test",
  "link_url": "https://example.com/secret",
  "purpose": "Testing encryption"
}

# Response shows decrypted URL
{
  "link_url": "https://example.com/secret"  ✅
}
```

### Test 2: Check Database

Open MongoDB Atlas and view the `importantLinks` collection:

```json
{
  "_id": "...",
  "link_name": "Test",
  "link_url": "a1b2c3d4:e5f6g7h8:i9j0k1l2...",  ← Encrypted!
  "purpose": "Testing encryption"
}
```

### Test 3: Retrieve Link

```bash
GET /api/important-links

# Response shows decrypted URL
[{
  "link_url": "https://example.com/secret"  ✅
}]
```

## Encryption Algorithm Details

- **Algorithm:** AES-256-GCM
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, random per encryption)
- **Auth Tag:** 128 bits (16 bytes, for integrity)
- **Format:** `iv:authTag:encryptedData` (hex encoded)

**Why AES-256-GCM?**
- ✅ Industry standard
- ✅ Authenticated encryption (prevents tampering)
- ✅ Fast and secure
- ✅ Used by governments and banks
- ✅ Resistant to known attacks

## Migration from Existing Data

If you already have data in MongoDB:

### Option 1: Re-enter Data
- Delete old records
- Add new records (will be encrypted automatically)

### Option 2: Migration Script
Create `server/scripts/encryptExistingData.js`:

```javascript
import { connectMongoDB } from '../config/mongodb.js';
import { ImportantLink } from '../db/schemas.js';
import { encryptUrl } from '../utils/encryption.js';

async function migrate() {
  await connectMongoDB();
  
  const links = await ImportantLink.find({});
  
  for (const link of links) {
    // Check if already encrypted (contains ':')
    if (!link.link_url.includes(':')) {
      link.link_url = encryptUrl(link.link_url);
      await link.save();
      console.log(`Encrypted: ${link.link_name}`);
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
```

Run: `node server/scripts/encryptExistingData.js`

## Troubleshooting

### Error: "Decryption failed"
- **Cause:** Wrong encryption key or corrupted data
- **Fix:** Check `ENCRYPTION_KEY` in `.env` matches the key used to encrypt

### Error: "No ENCRYPTION_KEY in .env"
- **Cause:** Missing environment variable
- **Fix:** Add `ENCRYPTION_KEY=...` to `server/.env`

### Data looks encrypted in UI
- **Cause:** Decryption not working
- **Fix:** Check server logs for decryption errors

## Production Deployment

When deploying to production:

1. **Generate new production key** (different from development)
2. **Set environment variable** on production server
3. **Use HTTPS** (required for security)
4. **Enable MongoDB Atlas IP whitelist**
5. **Use strong database passwords**
6. **Regular backups** of encryption key

## Support

If you have questions:
1. Check this guide
2. Review `server/utils/encryption.js`
3. Check server logs for errors

---

**Remember:** Encryption is only one layer of security. Always use:
- Strong passwords
- HTTPS
- Access control
- Regular updates
- Secure backups

🔒 **Your data is now protected!**
