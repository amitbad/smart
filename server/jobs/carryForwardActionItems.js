import { getDB, getDBType } from '../db/index.js';

function getNextWorkingDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const dayOfWeek = next.getDay();

  // Skip Saturday (6) and Sunday (0)
  if (dayOfWeek === 0) {
    next.setDate(next.getDate() + 1); // Sunday -> Monday
  } else if (dayOfWeek === 6) {
    next.setDate(next.getDate() + 2); // Saturday -> Monday
  }

  return next;
}

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function carryForwardActionItems() {
  try {
    const db = getDB();
    const dbType = getDBType();

    if (dbType !== 'Mongo') {
      console.log('⏭️  Carry-forward job: PostgreSQL not yet supported');
      return;
    }

    const today = normalizeDate(new Date());

    // Find incomplete items from before today that haven't been marked as moved
    const incompleteItems = await db.findAll('actionItems', {
      action_date: { $lt: today },
      status: { $nin: ['Completed', 'Deferred'] },
      is_moved: { $ne: true }
    });

    if (incompleteItems.length === 0) {
      console.log('✅ Carry-forward job: No items to carry forward');
      return;
    }

    let movedCount = 0;

    for (const item of incompleteItems) {
      const itemDate = normalizeDate(item.action_date);

      // Only process if item is before today
      if (itemDate >= today) continue;

      const originalDate = item.original_date || item.action_date;
      const history = item.carry_forward_history || [];

      history.push({
        from_date: item.action_date,
        to_date: today,
        moved_at: new Date()
      });

      // Mark original item as moved (read-only)
      await db.update('actionItems', item.id, {
        is_moved: true
      });

      // Create new carried-forward item for today
      const newItem = {
        action_date: today,
        original_date: originalDate,
        description: item.description,
        priority: item.priority,
        status: item.status,
        dependency_member_id: item.dependency_member_id,
        reference_link: item.reference_link,
        carry_forward_history: history,
        comments: item.comments || [],
        carried_from_id: item.id
      };

      await db.create('actionItems', newItem);
      movedCount++;
    }

    console.log(`✅ Carry-forward job: Carried forward ${movedCount} incomplete action item(s) to ${today.toDateString()}`);
  } catch (error) {
    console.error('❌ Carry-forward job error:', error);
  }
}
