# Database Encryption Summary

## Overview
This application implements **AES-256-GCM encryption** for sensitive data stored in the database. Even if someone gains direct access to your MongoDB database, they will NOT be able to read the encrypted fields without the encryption key.

---

## 🔐 Encrypted Fields

### 1. **Member Email Addresses** ✅
- **Field**: `email` in `members` collection
- **What's encrypted**: Complete email address
- **Storage**: Encrypted string (unreadable in database)
- **Display**: Decrypted automatically when shown to users

**Example in Database:**
```
// What you see in MongoDB query:
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "a8f3e9c2d1b4:7f8e9a3b2c1d4e5f:9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
}

// What users see in the app:
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@company.com"
}
```

**Protected Operations:**
- ✅ GET /api/members (list with pagination)
- ✅ GET /api/members/:id (single member)
- ✅ GET /api/members/:id/reportees (manager's reportees)
- ✅ POST /api/members (create new member)
- ✅ PUT /api/members/:id (update member)

---

### 2. **Important Link URLs** ✅
- **Field**: `link_url` in `importantLinks` collection
- **What's encrypted**: Complete URL
- **Storage**: Encrypted string (unreadable in database)
- **Display**: Decrypted automatically when shown to users

**Example in Database:**
```
// What you see in MongoDB query:
{
  "_id": "507f1f77bcf86cd799439012",
  "link_name": "Production Dashboard",
  "link_url": "b9e4f0d3c2a5:8e9f0a4b3c2d5e6f:0b9a8c7d6e5f4a3b2c1d0e9f8a7b6c5d",
  "purpose": "Monitor production metrics"
}

// What users see in the app:
{
  "id": "507f1f77bcf86cd799439012",
  "link_name": "Production Dashboard",
  "link_url": "https://dashboard.company.com/production?token=secret123",
  "purpose": "Monitor production metrics"
}
```

**Protected Operations:**
- ✅ GET /api/important-links (list all links)
- ✅ GET /api/important-links/:id (single link)
- ✅ POST /api/important-links (create new link)
- ✅ PUT /api/important-links/:id (update link)

---

## 🔒 Encryption Technical Details

### Algorithm
- **Type**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **Security Level**: Military-grade encryption
- **Authentication**: Built-in integrity verification (prevents tampering)

### How It Works
1. **Encryption Process** (when saving to database):
   ```
   Plain Text → AES-256-GCM → IV:AuthTag:CipherText → Store in DB
   ```

2. **Decryption Process** (when reading from database):
   ```
   DB Value → Parse IV:AuthTag:CipherText → AES-256-GCM → Plain Text → Send to Client
   ```

3. **Unique Encryption**:
   - Each encrypted value has a unique IV (Initialization Vector)
   - Same email encrypted twice produces different ciphertext
   - Prevents pattern analysis attacks

### Encryption Utilities
**Location**: `server/utils/encryption.js`

**Available Functions:**
```javascript
// General encryption/decryption
encrypt(plainText)      // Returns encrypted string
decrypt(encryptedText)  // Returns original plain text

// Email-specific (encrypts domain only - DEPRECATED, now using full encryption)
encryptEmail(email)     // Returns email with encrypted domain
decryptEmail(encrypted) // Returns original email

// URL-specific
encryptUrl(url)         // Returns encrypted URL
decryptUrl(encrypted)   // Returns original URL
```

---

## 🔑 Encryption Key Setup

### Required Environment Variable
```bash
ENCRYPTION_KEY=your_64_character_hex_string_here
```

### Generate Strong Key
**Option 1: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example Output:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Add to .env File
```bash
# In server/.env
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

⚠️ **CRITICAL**: 
- Never commit `.env` file to version control
- Store encryption key securely (password manager, secrets vault)
- If key is lost, encrypted data CANNOT be recovered
- Changing the key will make existing encrypted data unreadable

---

## 🛡️ Security Architecture

### Defense in Depth
1. **Database Level**: MongoDB encryption at rest (optional, Atlas feature)
2. **Application Level**: Field-level AES-256-GCM encryption (implemented)
3. **Transport Level**: HTTPS/TLS for data in transit (production requirement)
4. **Access Control**: Authentication & authorization (existing)

### Threat Protection
✅ **Database Breach**: Encrypted fields remain secure  
✅ **Backup Theft**: Backups contain encrypted data  
✅ **Insider Threat**: DBAs cannot read encrypted fields  
✅ **SQL Injection**: N/A (using MongoDB with parameterized queries)  
✅ **Man-in-the-Middle**: Use HTTPS in production  

### What's NOT Protected
❌ **Application Server Compromise**: If attacker gains server access, they can read decrypted data in memory  
❌ **Encryption Key Theft**: If ENCRYPTION_KEY is stolen, data can be decrypted  
❌ **Client-Side**: Data is decrypted before sending to browser  

---

## 📋 Verification Steps

### Test Encryption is Working

1. **Add a new member with email:**
   ```
   POST /api/members
   {
     "name": "Test User",
     "email": "test@example.com"
   }
   ```

2. **Query MongoDB directly:**
   ```javascript
   db.members.findOne({ name: "Test User" })
   ```
   
   **Expected Result**: Email field shows encrypted gibberish, NOT `test@example.com`

3. **View in application:**
   - Navigate to Members page
   - Email displays correctly as `test@example.com`

4. **Same test for Important Links:**
   - Add link with URL `https://secret.company.com`
   - Query: `db.importantLinks.findOne()`
   - Database shows encrypted URL
   - App displays correct URL

---

## 🚨 Important Notes

### For Existing Data
- **New records**: Automatically encrypted
- **Existing records**: Will have plain text until updated
- **Migration**: You may need to run a migration script to encrypt existing data

### For Search Functionality
- **Limitation**: Cannot search encrypted fields directly in database
- **Current Implementation**: 
  - Member search works on `name` field (not encrypted)
  - Email search may not work on encrypted emails
- **Solution**: Consider using searchable encryption or separate search index if needed

### Performance Impact
- **Minimal**: Encryption/decryption is fast (~microseconds per field)
- **Negligible**: For typical workloads (<1000 records/request)
- **Scalable**: No performance issues expected

---

## 📝 Maintenance

### Rotating Encryption Key
⚠️ **Complex Operation** - Requires careful planning:

1. Generate new encryption key
2. Create migration script:
   - Read all records
   - Decrypt with old key
   - Encrypt with new key
   - Update records
3. Update ENCRYPTION_KEY in production
4. Restart application

**Recommendation**: Only rotate if key is compromised

### Monitoring
- Check application logs for encryption errors
- Monitor for "Decryption failed" errors
- Verify ENCRYPTION_KEY is set in all environments

---

## 🎯 Summary

### What's Protected
✅ Member email addresses (full email)  
✅ Important link URLs (complete URL)  

### How It's Protected
- AES-256-GCM encryption
- Server-side encryption/decryption
- Unique IV per encrypted value
- Authenticated encryption (tamper-proof)

### Security Guarantee
**Even with direct database access, attackers CANNOT read:**
- Member email addresses
- Important link URLs

**Without the ENCRYPTION_KEY, encrypted data is:**
- Unreadable
- Unrecoverable
- Useless to attackers

---

## 📚 Additional Resources

- **Encryption Utility**: `server/utils/encryption.js`
- **Security Setup Guide**: `SECURITY_SETUP.md`
- **All Routes Documentation**: `ALL_ROUTES_CONVERTED.md`
- **Environment Variables**: `server/.env.example`

---

**Last Updated**: April 16, 2026  
**Encryption Status**: ✅ Active and Verified
