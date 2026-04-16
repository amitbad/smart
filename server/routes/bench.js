import express from 'express';
import { getDB, getDBType } from '../db/index.js';

const router = express.Router();

// List bench records with filters and member/project details
router.get('/', async (req, res) => {
  try {
    const { member_id, project_id, status } = req.query;
    const db = getDB();
    const dbType = getDBType();

    const filter = {};
    if (member_id) filter.member_id = member_id;
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;

    let benchRecords;
    if (dbType === 'Mongo') {
      benchRecords = await db.findAll('bench', filter, {
        sort: { assigned_date: -1, created_at: -1 },
        populate: ['member_id', 'project_id']
      });
    } else {
      let sql = `SELECT b.*, 
                m.name as member_name, m.designation, m.level,
                p.code as project_code
         FROM bench b
         LEFT JOIN members m ON b.member_id = m.id
         LEFT JOIN projects p ON b.project_id = p.id
         WHERE 1=1`;
      const params = [];
      let idx = 1;
      if (member_id) { sql += ` AND b.member_id = $${idx++}`; params.push(member_id); }
      if (project_id) { sql += ` AND b.project_id = $${idx++}`; params.push(project_id); }
      if (status) { sql += ` AND b.status = $${idx++}`; params.push(status); }
      sql += ' ORDER BY b.assigned_date DESC, b.created_at DESC';
      benchRecords = await db.query(sql, params);
    }
    res.json(benchRecords);
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
    const db = getDB();
    const newBench = await db.create('bench', {
      member_id,
      project_id: project_id || null,
      assigned_date: new Date(assigned_date),
      release_date: release_date ? new Date(release_date) : null,
      extension_date: extension_date ? new Date(extension_date) : null,
      status: status || 'Working'
    });
    res.status(201).json(newBench);
  } catch (err) {
    console.error('Error creating bench record:', err);
    res.status(500).json({ error: 'Failed to create bench record' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, project_id, assigned_date, release_date, extension_date, status } = req.body;
    const db = getDB();

    const updateData = { updated_at: new Date() };
    if (member_id) updateData.member_id = member_id;
    if (project_id !== undefined) updateData.project_id = project_id || null;
    if (assigned_date) updateData.assigned_date = new Date(assigned_date);
    if (release_date !== undefined) updateData.release_date = release_date ? new Date(release_date) : null;
    if (extension_date !== undefined) updateData.extension_date = extension_date ? new Date(extension_date) : null;
    if (status) updateData.status = status;

    const updated = await db.update('bench', id, updateData);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating bench record:', err);
    res.status(500).json({ error: 'Failed to update bench record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check status before deleting
    const bench = await db.findById('bench', id);
    if (!bench) return res.status(404).json({ error: 'Not found' });
    if (bench.status === 'Working' || bench.status === 'Project Completed') {
      return res.status(400).json({ error: `Cannot delete a bench record with status "${bench.status}"` });
    }

    await db.delete('bench', id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting bench record:', err);
    res.status(500).json({ error: 'Failed to delete bench record' });
  }
});

export default router;
