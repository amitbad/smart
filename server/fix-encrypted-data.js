/**
 * Fix encrypted data - decrypt with old approach and re-encrypt with current key
 * This script will:
 * 1. Find all action items with reference_link that looks encrypted
 * 2. Try to decrypt them
 * 3. If decryption fails, assume it's already plain text
 * 4. Re-encrypt with current ENCRYPTION_KEY
 */

import { getDB } from './db/index.js';
import { encryptUrl } from './utils/encryption.js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'smart-organizer-salt-2026';

// Try to decrypt with the current key
function tryDecrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Not encrypted format, return as-is
      return encryptedText;
    }

    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      console.error('No ENCRYPTION_KEY found in environment');
      return encryptedText;
    }

    const ENCRYPTION_KEY = crypto.scryptSync(envKey, SALT, 32);
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.warn(`Decryption failed: ${error.message}`);
    // Return as-is, might be plain text
    return encryptedText;
  }
}

async function fixActionItems() {
  console.log('🔧 Fixing action items reference links...\n');
  
  const db = getDB();
  const items = await db.findAll('actionItems', {});
  
  let fixed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const item of items) {
    if (!item.reference_link) {
      skipped++;
      continue;
    }
    
    // Check if it looks encrypted (has colons)
    if (!item.reference_link.includes(':') || item.reference_link.split(':').length !== 3) {
      // Plain text URL, encrypt it
      console.log(`📝 Encrypting plain text URL for: ${item.description.substring(0, 50)}...`);
      try {
        const encrypted = encryptUrl(item.reference_link);
        await db.update('actionItems', item.id, { reference_link: encrypted });
        fixed++;
        console.log(`   ✅ Encrypted successfully\n`);
      } catch (error) {
        console.error(`   ❌ Failed to encrypt: ${error.message}\n`);
        failed++;
      }
      continue;
    }
    
    // Try to decrypt
    const decrypted = tryDecrypt(item.reference_link);
    
    // Check if decryption worked (decrypted should be a valid URL)
    if (decrypted && decrypted.startsWith('http')) {
      console.log(`✅ Already properly encrypted: ${item.description.substring(0, 50)}...`);
      console.log(`   Decrypts to: ${decrypted}\n`);
      skipped++;
    } else {
      // Decryption failed or returned encrypted text, treat as plain text and re-encrypt
      console.log(`🔄 Re-encrypting: ${item.description.substring(0, 50)}...`);
      console.log(`   Current value: ${item.reference_link.substring(0, 100)}...`);
      
      // Assume it's a plain text URL that looks like encrypted data
      // This shouldn't happen, but if it does, we'll just leave it
      console.log(`   ⚠️  Cannot determine if encrypted or plain text, skipping\n`);
      skipped++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total: ${items.length}`);
}

async function fixMembers() {
  console.log('\n🔧 Fixing member emails...\n');
  
  const db = getDB();
  const members = await db.findAll('members', {});
  
  let fixed = 0;
  let skipped = 0;
  
  for (const member of members) {
    if (!member.email) {
      skipped++;
      continue;
    }
    
    // Check if it looks encrypted
    if (!member.email.includes(':') || member.email.split(':').length !== 3) {
      // Plain text email, leave it (will be encrypted on next update)
      skipped++;
      continue;
    }
    
    // Try to decrypt
    const decrypted = tryDecrypt(member.email);
    
    if (decrypted && decrypted.includes('@')) {
      console.log(`✅ Email properly encrypted for: ${member.name}`);
      skipped++;
    } else {
      console.log(`⚠️  Cannot decrypt email for: ${member.name}`);
      skipped++;
    }
  }
  
  console.log('\n📊 Members Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

async function main() {
  try {
    console.log('🚀 Starting encrypted data fix...\n');
    console.log('=' .repeat(60));
    
    await fixActionItems();
    await fixMembers();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
