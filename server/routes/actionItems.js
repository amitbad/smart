import express from 'express';
import { getDB, getDBType } from '../db/index.js';

const router = express.Router();

// List with filters and grouping by date (client can group)
router.get('/', async (req, res) => {
  try {
    const { date, priority, status, dependency } = req.query;
    const db = getDB();
    const dbType = getDBType();

    const filter = {};
    if (date) filter.action_date = new Date(date);
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (dependency) filter.dependency_member_id = dependency;

    const actionItems = await db.findAll('actionItems', filter, { sort: { action_date: -1, created_at: -1 } });
    res.json(actionItems);
  } catch (err) {
    console.error('Error fetching action items:', err);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { action_date, description, priority, status, dependency_member_id } = req.body;
    if (!action_date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }
    const db = getDB();
    const newItem = await db.create('actionItems', {
      action_date: new Date(action_date),
      description,
      priority: priority || 'Medium',
      status: status || 'Pending',
      dependency_member_id: dependency_member_id || null
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating action item:', err);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_date, description, priority, status, dependency_member_id } = req.body;
    const db = getDB();

    const updateData = { updated_at: new Date() };
    if (action_date) updateData.action_date = new Date(action_date);
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (dependency_member_id !== undefined) updateData.dependency_member_id = dependency_member_id || null;

    const updated = await db.update('actionItems', id, updateData);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating action item:', err);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Prevent delete if Completed
    const item = await db.findById('actionItems', id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot delete a Completed action item' });
    }

    await db.delete('actionItems', id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting action item:', err);
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});

export default router;
