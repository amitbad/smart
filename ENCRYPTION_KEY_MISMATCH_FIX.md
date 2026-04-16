# Encryption Key Mismatch - Quick Fix

## Problem
Reference links are showing as encrypted text in the UI instead of the actual URL. This happens because the data was encrypted with a different `ENCRYPTION_KEY` than what's currently in your `.env` file.

### Example
```
Displayed: ec210a5fbfad3bdb637c16cad2ca1142:b200083abd1ef7020b64993a8f334ebb:d62cc28...
Expected:  https://example.com/some-link
```

---

## Root Cause

**Encryption keys don't match:**
- Data was encrypted with Key A
- Current `.env` has Key B
- Decryption with Key B fails → returns encrypted text

This happens when:
1. You changed the `ENCRYPTION_KEY` in `.env`
2. You're using a different environment (dev vs prod)
3. The key was randomly generated and server restarted

---

## Solution Options

### Option 1: Clear Encrypted Links (Recommended)

**What it does:** Removes all encrypted reference links so you can re-add them

**Steps:**
```bash
cd server
node clear-encrypted-links.js
```

**Result:**
- All encrypted reference links set to `null`
- Plain text URLs (if any) are kept
- You can re-add links through the UI

**Pros:**
- ✅ Simple and safe
- ✅ No risk of data corruption
- ✅ Links will be encrypted with current key

**Cons:**
- ❌ Need to manually re-add links

---

### Option 2: Use Correct Encryption Key

**If you know the original key:**

1. Find the original `ENCRYPTION_KEY` that was used
2. Update `server/.env`:
   ```
   ENCRYPTION_KEY=<original_key_here>
   ```
3. Restart server

**Result:** Links will decrypt correctly

---

### Option 3: Generate New Key and Clear Data

**For a fresh start:**

1. Generate a new encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Update `server/.env`:
   ```
   ENCRYPTION_KEY=<new_key_from_step_1>
   ```

3. Clear encrypted data:
   ```bash
   cd server
   node clear-encrypted-links.js
   ```

4. Restart server

---

## Running the Clear Script

### Step 1: Stop the server
```bash
# Press Ctrl+C in the terminal running npm run dev
```

### Step 2: Run the script
```bash
cd server
node clear-encrypted-links.js
```

### Step 3: Review output
```
🔧 Clearing encrypted reference links...

🗑️  Clearing encrypted link for: Ask sattar what is the purpose of excel...
🗑️  Clearing encrypted link for: Another action item...

📊 Summary:
   🗑️  Cleared: 2
   ✅ Kept: 0
   📝 Total: 4

💡 You can now re-add the reference links through the UI
```

### Step 4: Restart server
```bash
npm run dev
```

### Step 5: Re-add links
- Go to Action Items page
- Edit each item that had a reference link
- Add the URL again
- Save

---

## Prevention

### Set a Permanent Encryption Key

**Generate a secure key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to `.env`:**
```bash
# In server/.env
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Important:**
- ✅ Use the same key across all environments
- ✅ Store key securely (password manager, secrets vault)
- ✅ Never commit `.env` to git
- ✅ Backup the key somewhere safe
- ❌ Don't change the key once data is encrypted

---

## Understanding the Issue

### How Encryption Works

```
Encrypt:
Plain Text + Key A → Encrypted Text

Decrypt:
Encrypted Text + Key A → Plain Text ✅
Encrypted Text + Key B → Error or Garbage ❌
```

### What Happened

```
Day 1: Encrypted with Key A
reference_link: "https://example.com"
    ↓ (encrypt with Key A)
reference_link: "ec210a5f..."

Day 2: Try to decrypt with Key B
reference_link: "ec210a5f..."
    ↓ (decrypt with Key B)
reference_link: "ec210a5f..." ❌ (decryption failed, returned as-is)
```

---

## Quick Reference

### Check Current Key
```bash
grep ENCRYPTION_KEY server/.env
```

### Generate New Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Clear Encrypted Links
```bash
cd server
node clear-encrypted-links.js
```

### Check Action Items in Database
```bash
# MongoDB
mongosh
use smart_organizer
db.actionitems.find({ reference_link: { $ne: null } }).pretty()

# PostgreSQL
psql -U postgres -d smart_organizer
SELECT description, reference_link FROM action_items WHERE reference_link IS NOT NULL;
```

---

## Summary

**Problem:** Reference links showing as encrypted text  
**Cause:** Encryption key mismatch  
**Solution:** Clear encrypted links and re-add them  
**Prevention:** Use permanent encryption key  

**Quick Fix:**
```bash
cd server
node clear-encrypted-links.js
# Then re-add links through UI
```

---

**Last Updated:** April 16, 2026
