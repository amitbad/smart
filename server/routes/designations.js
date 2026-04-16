import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List all designations (alphabetical)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM designations ORDER BY name ASC');
    res.json(result.rows);
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
    const result = await pool.query(
      'INSERT INTO designations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
      [name.trim()]
    );

    if (result.rows.length === 0) {
      // Already exists, fetch existing
      const existing = await pool.query('SELECT id, name FROM designations WHERE name = $1', [name.trim()]);
      return res.status(200).json(existing.rows[0]);
    }

    res.status(201).json(result.rows[0]);
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
    const result = await pool.query(
      'UPDATE designations SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name',
      [name.trim(), id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
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
    const del = await pool.query('DELETE FROM designations WHERE id = $1', [id]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    res.status(500).json({ error: 'Failed to delete designation' });
  }
});

export default router;
