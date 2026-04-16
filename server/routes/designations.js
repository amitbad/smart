import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

// List all designations (alphabetical)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const designations = await db.findAll('designations', {}, { sort: { name: 1 } });
    res.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
});

// Create a new designation if not exists
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Designation name is required' });
    }
    const db = getDB();

    const existing = await db.findOne('designations', { name: name.trim() });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newDesignation = await db.create('designations', { name: name.trim() });
    res.status(201).json(newDesignation);
  } catch (error) {
    console.error('Error creating designation:', error);
    res.status(500).json({ error: 'Failed to create designation' });
  }
});

// Update a designation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Designation name is required' });
    }
    const db = getDB();
    const updated = await db.update('designations', id, { name: name.trim(), updated_at: new Date() });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Designation name must be unique' });
    }
    console.error('Error updating designation:', error);
    res.status(500).json({ error: 'Failed to update designation' });
  }
});

// Delete a designation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const deleted = await db.delete('designations', id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    res.status(500).json({ error: 'Failed to delete designation' });
  }
});

export default router;
