import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import { encryptEmail, decryptEmail } from '../utils/encryption.js';

const router = express.Router();

// List emails with filters
router.get('/', async (req, res) => {
  try {
    const { date, priority, status, sender, reply_by } = req.query;
    const db = getDB();
    const dbType = getDBType();

    const filter = {};
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (reply_by) filter.reply_by = new Date(reply_by);

    let emails;
    if (date || sender) {
      if (dbType === 'Mongo') {
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          filter.received_at = { $gte: startDate, $lt: endDate };
        }
        if (sender) filter.sender = new RegExp(sender, 'i');
        emails = await db.findAll('emails', filter, { sort: { received_at: -1, created_at: -1 } });
      } else {
        let sql = 'SELECT * FROM emails WHERE 1=1';
        const params = [];
        let idx = 1;
        if (date) { sql += ` AND received_at::date = $${idx++}`; params.push(date); }
        if (priority) { sql += ` AND priority = $${idx++}`; params.push(priority); }
        if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
        if (sender) { sql += ` AND sender ILIKE $${idx++}`; params.push(`%${sender}%`); }
        if (reply_by) { sql += ` AND reply_by = $${idx++}`; params.push(reply_by); }
        sql += ' ORDER BY received_at DESC, created_at DESC';
        emails = await db.query(sql, params);
      }
    } else {
      emails = await db.findAll('emails', filter, { sort: { received_at: -1, created_at: -1 } });
    }

    // Decrypt email senders before sending to client
    const decryptedEmails = emails.map(email => ({
      ...email,
      sender: decryptEmail(email.sender)
    }));

    res.json(decryptedEmails);
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, sender, received_at, priority, reply_by, status } = req.body;
    if (!subject || !sender) return res.status(400).json({ error: 'Subject and Sender are required' });
    const db = getDB();

    // Encrypt sender email before storing
    const encryptedSender = encryptEmail(sender);

    const newEmail = await db.create('emails', {
      subject,
      sender: encryptedSender,
      received_at: received_at ? new Date(received_at) : new Date(),
      priority: priority || 'Medium',
      reply_by: reply_by ? new Date(reply_by) : null,
      status: status || 'Not Replied'
    });

    // Decrypt sender before sending response
    newEmail.sender = decryptEmail(newEmail.sender);

    res.status(201).json(newEmail);
  } catch (err) {
    console.error('Error creating email:', err);
    res.status(500).json({ error: 'Failed to create email' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, sender, received_at, priority, reply_by, status } = req.body;
    const db = getDB();

    const updateData = { updated_at: new Date() };
    if (subject) updateData.subject = subject;
    if (sender) updateData.sender = encryptEmail(sender);
    if (received_at) updateData.received_at = new Date(received_at);
    if (priority) updateData.priority = priority;
    if (reply_by !== undefined) updateData.reply_by = reply_by ? new Date(reply_by) : null;
    if (status) updateData.status = status;

    const updated = await db.update('emails', id, updateData);
    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Decrypt sender before sending response
    updated.sender = decryptEmail(updated.sender);

    res.json(updated);
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    await db.delete('emails', id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting email:', err);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

export default router;
