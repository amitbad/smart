import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List all departments (alphabetical)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM departments ORDER BY name ASC');
    res.json(result.rows);
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
    const result = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
      [name.trim()]
    );
    if (result.rows.length === 0) {
      const existing = await pool.query('SELECT id, name FROM departments WHERE name = $1', [name.trim()]);
      return res.status(200).json(existing.rows[0]);
    }
    res.status(201).json(result.rows[0]);
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
    const result = await pool.query(
      'UPDATE departments SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name',
      [name.trim(), id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
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
    const del = await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
