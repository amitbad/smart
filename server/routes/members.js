import express from 'express';
import pool from '../config/database.js';
import { getDB, getDBType } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', level = '' } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();
    const dbType = getDBType();

    // MongoDB simple implementation
    if (dbType === 'Mongo') {
      const filter = {};
      if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [
          { name: regex },
          { email: regex }
        ];
      }
      if (level) filter.level = parseInt(level);

      const totalRecords = await db.count('members', filter);
      const members = await db.findAll('members', filter, {
        sort: { created_at: -1 },
        limit: parseInt(limit),
        skip: offset,
        populate: ['manager_id', 'designation_id', 'department_id']
      });

      return res.json({
        members,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          pageSize: parseInt(limit)
        }
      });
    }

    // PostgreSQL with complex JOINs
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (m.name ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex} OR m.designation ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (level) {
      whereClause += ` AND m.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM members m ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        m.*,
        mgr.name as manager_name,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as skills
      FROM members m
      LEFT JOIN members mgr ON m.manager_id = mgr.id
      LEFT JOIN member_skills ms ON m.id = ms.member_id
      LEFT JOIN skills s ON ms.skill_id = s.id
      ${whereClause}
      GROUP BY m.id, mgr.name
      ORDER BY m.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.get('/hierarchy', async (req, res) => {
  try {
    const db = getDB();
    const dbType = getDBType();

    // MongoDB simple hierarchy
    if (dbType === 'Mongo') {
      const members = await db.findAll('members', {}, {
        sort: { level: 1, name: 1 },
        populate: ['manager_id', 'designation_id']
      });
      return res.json(members);
    }

    // PostgreSQL recursive CTE
    const result = await pool.query(`
      WITH RECURSIVE member_hierarchy AS (
        SELECT 
          id, name, email, designation, level, manager_id,
          ARRAY[id] as path,
          0 as depth
        FROM members
        WHERE manager_id IS NULL
        
        UNION ALL
        
        SELECT 
          m.id, m.name, m.email, m.designation, m.level, m.manager_id,
          mh.path || m.id,
          mh.depth + 1
        FROM members m
        INNER JOIN member_hierarchy mh ON m.manager_id = mh.id
      )
      SELECT * FROM member_hierarchy
      ORDER BY path
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const dbType = getDBType();

    // MongoDB simple get
    if (dbType === 'Mongo') {
      const member = await db.findById('members', id);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      // Populate related data
      if (member.manager_id) {
        const manager = await db.findById('members', member.manager_id);
        member.manager_name = manager?.name;
      }
      if (member.designation_id) {
        const designation = await db.findById('designations', member.designation_id);
        member.designation = designation?.name;
      }
      if (member.department_id) {
        const department = await db.findById('departments', member.department_id);
        member.department = department?.name;
      }
      member.skills = [];

      return res.json(member);
    }

    // PostgreSQL with JOINs
    const result = await pool.query(`
      SELECT 
        m.*,
        mgr.name as manager_name,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as skills
      FROM members m
      LEFT JOIN members mgr ON m.manager_id = mgr.id
      LEFT JOIN member_skills ms ON m.id = ms.member_id
      LEFT JOIN skills s ON ms.skill_id = s.id
      WHERE m.id = $1
      GROUP BY m.id, mgr.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

router.get('/:id/reportees', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM members
      WHERE manager_id = $1
      ORDER BY name
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reportees:', error);
    res.status(500).json({ error: 'Failed to fetch reportees' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, designation, level, manager_id, skills } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    await client.query('BEGIN');

    // Ensure designation exists in master list (if provided)
    if (designation && designation.trim()) {
      await client.query(
        `INSERT INTO designations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [designation.trim()]
      );
    }

    const result = await client.query(`
      INSERT INTO members (name, email, designation, level, manager_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, designation, level, manager_id]);

    const member = result.rows[0];

    if (skills && skills.length > 0) {
      for (const skillId of skills) {
        await client.query(`
          INSERT INTO member_skills (member_id, skill_id)
          VALUES ($1, $2)
          ON CONFLICT (member_id, skill_id) DO NOTHING
        `, [member.id, skillId]);
      }
    }

    await client.query('COMMIT');

    const memberWithSkills = await pool.query(`
      SELECT 
        m.*,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as skills
      FROM members m
      LEFT JOIN member_skills ms ON m.id = ms.member_id
      LEFT JOIN skills s ON ms.skill_id = s.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [member.id]);

    res.status(201).json(memberWithSkills.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, email, designation, level, manager_id, skills } = req.body;

    await client.query('BEGIN');

    // Ensure designation exists in master list (if provided)
    if (designation && designation.trim()) {
      await client.query(
        `INSERT INTO designations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [designation.trim()]
      );
    }

    const result = await client.query(`
      UPDATE members
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          designation = COALESCE($3, designation),
          level = COALESCE($4, level),
          manager_id = COALESCE($5, manager_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, email, designation, level, manager_id, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member not found' });
    }

    if (skills !== undefined) {
      await client.query('DELETE FROM member_skills WHERE member_id = $1', [id]);

      if (skills.length > 0) {
        for (const skillId of skills) {
          await client.query(`
            INSERT INTO member_skills (member_id, skill_id)
            VALUES ($1, $2)
            ON CONFLICT (member_id, skill_id) DO NOTHING
          `, [id, skillId]);
        }
      }
    }

    await client.query('COMMIT');

    const memberWithSkills = await pool.query(`
      SELECT 
        m.*,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as skills
      FROM members m
      LEFT JOIN member_skills ms ON m.id = ms.member_id
      LEFT JOIN skills s ON ms.skill_id = s.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [id]);

    res.json(memberWithSkills.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const unassign = (req.query.unassign || '').toString().toLowerCase() === 'true';

    const depResult = await client.query('SELECT COUNT(*)::int AS cnt FROM members WHERE manager_id = $1', [id]);
    const dependents = depResult.rows[0]?.cnt || 0;

    if (dependents > 0 && !unassign) {
      return res.status(409).json({
        error: 'Member has associated records as Resource Manager',
        dependents
      });
    }

    await client.query('BEGIN');

    if (dependents > 0 && unassign) {
      await client.query('UPDATE members SET manager_id = NULL WHERE manager_id = $1', [id]);
    }

    const result = await client.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Member deleted successfully', unassigned: dependents });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  } finally {
    client.release();
  }
});

export default router;
