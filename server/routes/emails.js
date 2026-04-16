import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// List emails with filters
router.get('/', async (req, res) => {
  try {
    const { date, priority, status, sender, reply_by } = req.query;
    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (date) { where += ` AND received_at::date = $${idx++}`; params.push(date); }
    if (priority) { where += ` AND priority = $${idx++}`; params.push(priority); }
    if (status) { where += ` AND status = $${idx++}`; params.push(status); }
    if (sender) { where += ` AND sender ILIKE $${idx++}`; params.push(`%${sender}%`); }
    if (reply_by) { where += ` AND reply_by = $${idx++}`; params.push(reply_by); }

    const result = await pool.query(
      `SELECT * FROM emails ${where} ORDER BY received_at DESC, created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, sender, received_at, priority, reply_by, status } = req.body;
    if (!subject || !sender) return res.status(400).json({ error: 'Subject and Sender are required' });
    const result = await pool.query(
      `INSERT INTO emails (subject, sender, received_at, priority, reply_by, status)
       VALUES ($1, $2, COALESCE($3, NOW()), $4, $5, $6)
       RETURNING *`,
      [subject, sender, received_at || null, priority || 'Medium', reply_by || null, status || 'Not Replied']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating email:', err);
    res.status(500).json({ error: 'Failed to create email' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, sender, received_at, priority, reply_by, status } = req.body;
    const result = await pool.query(
      `UPDATE emails
       SET subject = COALESCE($1, subject),
           sender = COALESCE($2, sender),
           received_at = COALESCE($3, received_at),
           priority = COALESCE($4, priority),
           reply_by = COALESCE($5, reply_by),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [subject, sender, received_at, priority, reply_by, status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM emails WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting email:', err);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

export default router;
