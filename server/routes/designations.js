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

export default router;
