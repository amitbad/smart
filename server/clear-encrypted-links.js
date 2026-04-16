/**
 * Clear encrypted reference links that cannot be decrypted
 * This will set reference_link to null for all action items where the link looks encrypted
 * You can then re-add the links through the UI
 */

import { getDB } from './db/index.js';

async function clearEncryptedLinks() {
  console.log('🔧 Clearing encrypted reference links...\n');
  
  const db = getDB();
  const items = await db.findAll('actionItems', {});
  
  let cleared = 0;
  let skipped = 0;
  
  for (const item of items) {
    if (!item.reference_link) {
      skipped++;
      continue;
    }
    
    // Check if it looks encrypted (has colons and 3 parts)
    const parts = item.reference_link.split(':');
    if (parts.length === 3 && parts[0].length > 10) {
      // Looks encrypted, clear it
      console.log(`🗑️  Clearing encrypted link for: ${item.description.substring(0, 60)}...`);
      await db.update('actionItems', item.id, { reference_link: null });
      cleared++;
    } else if (item.reference_link.startsWith('http')) {
      // Plain text URL, keep it
      console.log(`✅ Keeping plain text URL for: ${item.description.substring(0, 60)}...`);
      skipped++;
    } else {
      // Unknown format
      console.log(`⚠️  Unknown format for: ${item.description.substring(0, 60)}...`);
      console.log(`   Value: ${item.reference_link.substring(0, 100)}`);
      skipped++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   🗑️  Cleared: ${cleared}`);
  console.log(`   ✅ Kept: ${skipped}`);
  console.log(`   📝 Total: ${items.length}`);
  console.log('\n💡 You can now re-add the reference links through the UI');
}

async function main() {
  try {
    console.log('🚀 Starting...\n');
    console.log('=' .repeat(60));
    
    await clearEncryptedLinks();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
