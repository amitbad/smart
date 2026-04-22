import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import crypto from 'crypto';

const router = express.Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ALGORITHM = 'aes-256-cbc';

function encryptUrl(url) {
  if (!url) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptUrl(encrypted) {
  if (!encrypted) return null;
  try {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

// Get next requirement number
async function getNextRequirementNumber(db) {
  const dbType = getDBType();
  if (dbType === 'Mongo') {
    const lastReq = await db.findAll('requirements', {}, { sort: { requirement_number: -1 }, limit: 1 });
    return lastReq.length > 0 ? lastReq[0].requirement_number + 1 : 1;
  } else {
    const result = await db.query('SELECT MAX(requirement_number) as max_num FROM requirements');
    return (result.rows[0]?.max_num || 0) + 1;
  }
}

// GET all requirements with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, member_id } = req.query;
    const db = getDB();
    const dbType = getDBType();

    if (dbType === 'Mongo') {
      const filter = {};
      if (status) filter.status = status;
      if (member_id) filter.member_id = member_id;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const requirements = await db.findAll('requirements', filter, {
        sort: { requirement_number: -1 },
        skip,
        limit: parseInt(limit),
        populate: ['member_id']
      });

      const total = await db.models.requirements.countDocuments(filter);

      // Decrypt requirement links
      const decrypted = requirements.map(req => ({
        ...req,
        requirement_link: req.requirement_link ? decryptUrl(req.requirement_link) : null
      }));

      res.json({
        requirements: decrypted,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } else {
      let query = `
        SELECT r.*, m.name as member_name, m.level as member_level
        FROM requirements r
        LEFT JOIN members m ON r.member_id = m.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND r.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      if (member_id) {
        query += ` AND r.member_id = $${paramIndex}`;
        params.push(member_id);
        paramIndex++;
      }

      query += ` ORDER BY r.requirement_number DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await db.query(query, params);

      const countQuery = `SELECT COUNT(*) as total FROM requirements r WHERE 1=1${status ? ' AND r.status = $1' : ''}${member_id ? ` AND r.member_id = $${status ? 2 : 1}` : ''}`;
      const countParams = [];
      if (status) countParams.push(status);
      if (member_id) countParams.push(member_id);
      const countResult = await db.query(countQuery, countParams);

      const decrypted = result.rows.map(req => ({
        ...req,
        requirement_link: req.requirement_link ? decryptUrl(req.requirement_link) : null
      }));

      res.json({
        requirements: decrypted,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
      });
    }
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// GET single requirement by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const dbType = getDBType();

    if (dbType === 'Mongo') {
      const requirement = await db.findById('requirements', id);
      if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

      requirement.requirement_link = requirement.requirement_link ? decryptUrl(requirement.requirement_link) : null;
      res.json(requirement);
    } else {
      const result = await db.query('SELECT * FROM requirements WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Requirement not found' });

      const requirement = result.rows[0];
      requirement.requirement_link = requirement.requirement_link ? decryptUrl(requirement.requirement_link) : null;
      res.json(requirement);
    }
  } catch (error) {
    console.error('Error fetching requirement:', error);
    res.status(500).json({ error: 'Failed to fetch requirement' });
  }
});

// POST create new requirement
router.post('/', async (req, res) => {
  try {
    const {
      status = 'Pending',
      engagement_start_date,
      engagement_end_date,
      member_id,
      project_id,
      pi_done = false,
      pi_date,
      pi_result,
      ci_done = false,
      ci_date,
      ci_result,
      requirement_link
    } = req.body;

    const db = getDB();
    const dbType = getDBType();
    const requirement_number = await getNextRequirementNumber(db);

    const encryptedLink = requirement_link ? encryptUrl(requirement_link) : null;

    if (dbType === 'Mongo') {
      const newReq = await db.create('requirements', {
        requirement_number,
        status,
        engagement_start_date: engagement_start_date ? new Date(engagement_start_date) : null,
        engagement_end_date: engagement_end_date ? new Date(engagement_end_date) : null,
        member_id: member_id || null,
        project_id: project_id || null,
        pi_done,
        pi_date: pi_date ? new Date(pi_date) : null,
        pi_result: pi_result || null,
        ci_done,
        ci_date: ci_date ? new Date(ci_date) : null,
        ci_result: ci_result || null,
        requirement_link: encryptedLink,
        status_logs: [],
        created_at: new Date(),
        updated_at: new Date()
      });

      newReq.requirement_link = requirement_link;
      res.status(201).json(newReq);
    } else {
      const result = await db.query(
        `INSERT INTO requirements (
          requirement_number, status, engagement_start_date, engagement_end_date,
          member_id, project_id, pi_done, pi_date, pi_result, ci_done, ci_date, ci_result,
          requirement_link, status_logs, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          requirement_number, status,
          engagement_start_date || null, engagement_end_date || null,
          member_id || null,
          project_id || null,
          pi_done, pi_date || null, pi_result || null,
          ci_done, ci_date || null, ci_result || null,
          encryptedLink,
          JSON.stringify([]),
          new Date(), new Date()
        ]
      );

      const newReq = result.rows[0];
      newReq.requirement_link = requirement_link;
      res.status(201).json(newReq);
    }
  } catch (error) {
    console.error('Error creating requirement:', error);
    res.status(500).json({ error: 'Failed to create requirement' });
  }
});

// PUT update requirement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      engagement_start_date,
      engagement_end_date,
      member_id,
      project_id,
      pi_done,
      pi_date,
      pi_result,
      ci_done,
      ci_date,
      ci_result,
      requirement_link,
      status_log
    } = req.body;

    const db = getDB();
    const dbType = getDBType();

    // Get existing requirement to check status change
    const existing = await db.findById('requirements', id);
    if (!existing) return res.status(404).json({ error: 'Requirement not found' });

    const updateData = { updated_at: new Date() };
    if (status !== undefined) updateData.status = status;
    if (engagement_start_date !== undefined) updateData.engagement_start_date = engagement_start_date ? new Date(engagement_start_date) : null;
    if (engagement_end_date !== undefined) updateData.engagement_end_date = engagement_end_date ? new Date(engagement_end_date) : null;
    if (member_id !== undefined) updateData.member_id = member_id || null;
    if (project_id !== undefined) updateData.project_id = project_id || null;
    if (pi_done !== undefined) updateData.pi_done = pi_done;
    if (pi_date !== undefined) updateData.pi_date = pi_date ? new Date(pi_date) : null;
    if (pi_result !== undefined) updateData.pi_result = pi_result || null;
    if (ci_done !== undefined) updateData.ci_done = ci_done;
    if (ci_date !== undefined) updateData.ci_date = ci_date ? new Date(ci_date) : null;
    if (ci_result !== undefined) updateData.ci_result = ci_result || null;
    if (requirement_link !== undefined) updateData.requirement_link = requirement_link ? encryptUrl(requirement_link) : null;

    // Handle status log addition
    if (status_log && status_log.date && status_log.description) {
      const newLog = {
        status: status || existing.status,
        from_status: existing.status,
        date: new Date(status_log.date),
        description: status_log.description,
        created_at: new Date()
      };

      if (dbType === 'Mongo') {
        const logs = Array.isArray(existing.status_logs) ? [...existing.status_logs] : [];
        logs.push(newLog);
        updateData.status_logs = logs;
      } else {
        const logs = existing.status_logs ? JSON.parse(existing.status_logs) : [];
        logs.push(newLog);
        updateData.status_logs = JSON.stringify(logs);
      }
    }

    const updated = await db.update('requirements', id, updateData);
    if (!updated) return res.status(404).json({ error: 'Requirement not found' });

    updated.requirement_link = updated.requirement_link ? decryptUrl(updated.requirement_link) : null;
    res.json(updated);
  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

// PUT update status log
router.put('/:id/logs/:logIndex', async (req, res) => {
  try {
    const { id, logIndex } = req.params;
    const { date, description } = req.body;

    const db = getDB();
    const dbType = getDBType();

    const requirement = await db.findById('requirements', id);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    const logs = dbType === 'Mongo'
      ? (Array.isArray(requirement.status_logs) ? [...requirement.status_logs] : [])
      : JSON.parse(requirement.status_logs || '[]');

    const index = parseInt(logIndex);
    if (index < 0 || index >= logs.length) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    if (date) logs[index].date = new Date(date);
    if (description !== undefined) logs[index].description = description;

    const updateData = dbType === 'Mongo'
      ? { status_logs: logs, updated_at: new Date() }
      : { status_logs: JSON.stringify(logs), updated_at: new Date() };

    const updated = await db.update('requirements', id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating status log:', error);
    res.status(500).json({ error: 'Failed to update status log' });
  }
});

// DELETE status log
router.delete('/:id/logs/:logIndex', async (req, res) => {
  try {
    const { id, logIndex } = req.params;

    const db = getDB();
    const dbType = getDBType();

    const requirement = await db.findById('requirements', id);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    const logs = dbType === 'Mongo'
      ? (Array.isArray(requirement.status_logs) ? [...requirement.status_logs] : [])
      : JSON.parse(requirement.status_logs || '[]');

    const index = parseInt(logIndex);
    if (index < 0 || index >= logs.length) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    logs.splice(index, 1);

    const updateData = dbType === 'Mongo'
      ? { status_logs: logs, updated_at: new Date() }
      : { status_logs: JSON.stringify(logs), updated_at: new Date() };

    const updated = await db.update('requirements', id, updateData);
    res.json({ message: 'Log entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting status log:', error);
    res.status(500).json({ error: 'Failed to delete status log' });
  }
});

// DELETE requirement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const requirement = await db.findById('requirements', id);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

    // Check if status has changed from Pending
    if (requirement.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot delete requirement. Status has been changed from Pending.' });
    }

    await db.delete('requirements', id);
    res.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ error: 'Failed to delete requirement' });
  }
});

export default router;
