import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List with filters and grouping by date (client can group)
router.get('/', async (req, res) => {
  try {
    const { date, priority, status, dependency } = req.query;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (date) { where += ` AND action_date = $${idx++}`; params.push(date); }
    if (priority) { where += ` AND priority = $${idx++}`; params.push(priority); }
    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (dependency) {
      // match any dependency member id
      where += ` AND $${idx++} = ANY(dependency_member_ids)`;
      params.push(parseInt(dependency));
    }

    const result = await pool.query(
      `SELECT * FROM action_items ${where} ORDER BY action_date DESC, created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching action items:', err);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { action_date, description, priority, status, dependency_member_ids } = req.body;
    if (!action_date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }
    const result = await pool.query(
      `INSERT INTO action_items (action_date, description, priority, status, dependency_member_ids)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [action_date, description, priority, status, dependency_member_ids || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating action item:', err);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_date, description, priority, status, dependency_member_ids } = req.body;
    const result = await pool.query(
      `UPDATE action_items
         SET action_date = COALESCE($1, action_date),
             description = COALESCE($2, description),
             priority = COALESCE($3, priority),
             status = COALESCE($4, status),
             dependency_member_ids = COALESCE($5, dependency_member_ids),
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [action_date, description, priority, status, dependency_member_ids, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating action item:', err);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent delete if Completed
    const chk = await pool.query('SELECT status FROM action_items WHERE id = $1', [id]);
    if (chk.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (chk.rows[0].status === 'Completed') {
      return res.status(400).json({ error: 'Cannot delete a Completed action item' });
    }
    await pool.query('DELETE FROM action_items WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting action item:', err);
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});

export default router;
