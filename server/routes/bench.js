import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List bench records with filters and member/project details
router.get('/', async (req, res) => {
  try {
    const { member_id, project_id, status } = req.query;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (member_id) { where += ` AND b.member_id = $${idx++}`; params.push(member_id); }
    if (project_id) { where += ` AND b.project_id = $${idx++}`; params.push(project_id); }
    if (status) { where += ` AND b.status = $${idx++}`; params.push(status); }

    const result = await pool.query(
      `SELECT b.*, 
              m.name as member_name, m.designation, m.level,
              p.code as project_code
       FROM bench b
       LEFT JOIN members m ON b.member_id = m.id
       LEFT JOIN projects p ON b.project_id = p.id
       ${where}
       ORDER BY b.assigned_date DESC, b.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bench records:', err);
    res.status(500).json({ error: 'Failed to fetch bench records' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { member_id, project_id, assigned_date, release_date, extension_date, status } = req.body;
    if (!member_id || !assigned_date) {
      return res.status(400).json({ error: 'Member and Assigned Date are required' });
    }
    const result = await pool.query(
      `INSERT INTO bench (member_id, project_id, assigned_date, release_date, extension_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [member_id, project_id || null, assigned_date, release_date || null, extension_date || null, status || 'Working']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating bench record:', err);
    res.status(500).json({ error: 'Failed to create bench record' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, project_id, assigned_date, release_date, extension_date, status } = req.body;
    const result = await pool.query(
      `UPDATE bench
       SET member_id = COALESCE($1, member_id),
           project_id = COALESCE($2, project_id),
           assigned_date = COALESCE($3, assigned_date),
           release_date = COALESCE($4, release_date),
           extension_date = COALESCE($5, extension_date),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [member_id, project_id, assigned_date, release_date, extension_date, status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating bench record:', err);
    res.status(500).json({ error: 'Failed to update bench record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check status before deleting
    const chk = await pool.query('SELECT status FROM bench WHERE id = $1', [id]);
    if (chk.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (chk.rows[0].status === 'Working' || chk.rows[0].status === 'Project Completed') {
      return res.status(400).json({ error: `Cannot delete a bench record with status "${chk.rows[0].status}"` });
    }
    await pool.query('DELETE FROM bench WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting bench record:', err);
    res.status(500).json({ error: 'Failed to delete bench record' });
  }
});

export default router;
