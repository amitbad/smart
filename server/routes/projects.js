import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List projects (order by code)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT id, code, delivery_manager_id FROM projects';
    const params = [];
    if (q && q.trim()) {
      sql += ' WHERE code ILIKE $1';
      params.push(`%${q.trim()}%`);
    }
    sql += ' ORDER BY code ASC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { code, delivery_manager_id } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Project code is required' });
    const dm = delivery_manager_id ? parseInt(delivery_manager_id) : null;
    const result = await pool.query(
      'INSERT INTO projects (code, delivery_manager_id) VALUES ($1, $2) RETURNING id, code, delivery_manager_id',
      [code.trim(), dm]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Project code must be unique' });
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, delivery_manager_id } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Project code is required' });
    const dm = delivery_manager_id ? parseInt(delivery_manager_id) : null;
    const result = await pool.query(
      'UPDATE projects SET code = $1, delivery_manager_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, code, delivery_manager_id',
      [code.trim(), dm, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Project code must be unique' });
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const del = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
