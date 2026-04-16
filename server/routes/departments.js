import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

// List all departments (alphabetical)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const departments = await db.findAll('departments', {}, { sort: { name: 1 } });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create new department (unique by name)
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const db = getDB();

    const existing = await db.findOne('departments', { name: name.trim() });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newDepartment = await db.create('departments', { name: name.trim() });
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const db = getDB();
    const updated = await db.update('departments', id, { name: name.trim(), updated_at: new Date() });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Department name must be unique' });
    }
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const deleted = await db.delete('departments', id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
