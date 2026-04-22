import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import pool from '../config/database.js';

const router = express.Router();

// Categories CRUD (simple: list, create)
router.get('/categories', async (req, res) => {
  try {
    const dbType = getDBType();
    if (dbType === 'Mongo') {
      const db = getDB();
      const cats = await db.findAll('questionCategories', {}, { sort: { name: 1 } });
      return res.json(cats);
    }
    const result = await pool.query('SELECT id, name, created_at, updated_at FROM question_categories ORDER BY name');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Bulk parse-and-create from pasted text
router.post('/bulk', async (req, res) => {
  try {
    const { skill_id, text, skill_name } = req.body || {};
    console.log('📝 Bulk add request:', { skill_id, skill_name, text_length: text?.length });

    if ((!skill_id && !skill_name) || !text || !String(text).trim()) {
      return res.status(400).json({ error: 'skill_id or skill_name and text are required' });
    }

    // Parse lines like: Q1. Question text (Easy)
    const lines = String(text)
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    const items = [];
    const re = /^Q\d+\.?\s*(.+?)(?:\s*\((Easy|Medium|High|Low|Hard)\))?\s*$/i;
    for (const l of lines) {
      const m = l.match(re);
      if (!m) continue;
      const qt = m[1].trim();
      const diffRaw = (m[2] || 'Low').toLowerCase();
      // Normalize difficulty to Low/Medium/High
      let difficulty = 'Low';
      if (diffRaw === 'medium') difficulty = 'Medium';
      else if (diffRaw === 'high' || diffRaw === 'hard') difficulty = 'High';
      else difficulty = 'Low'; // map Easy/Low -> Low
      if (qt) items.push({ question_text: qt, difficulty });
    }
    console.log('📊 Parsed items:', items.length);

    if (items.length === 0) {
      return res.status(400).json({ error: 'No questions detected in text' });
    }

    const dbType = getDBType();
    console.log('💾 DB Type:', dbType);

    if (dbType === 'Mongo') {
      const db = getDB();
      // Resolve skill name
      let skillName = '';
      let skill = null;
      if (skill_id) {
        try {
          skill = await db.findById('skills', skill_id);
        } catch (e) {
          // ignore invalid ObjectId errors and fallback to name
        }
      }
      if (!skill && skill_name) {
        const escapedName = String(skill_name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        skill = await db.findOne('skills', { name: new RegExp(`^${escapedName}$`, 'i') });
      }
      if (!skill) return res.status(400).json({ error: 'Invalid skill reference' });
      skillName = skill.name?.trim();
      if (!skillName) return res.status(400).json({ error: 'Skill has no name' });

      // Ensure a question category exists with same name (case-insensitive)
      const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let category = await db.findOne('questionCategories', { name: new RegExp(`^${escaped}$`, 'i') });
      if (!category) {
        category = await db.create('questionCategories', { name: skillName });
      }
      const category_id = category.id || category._id?.toString();

      const created = [];
      for (const it of items) {
        const q = await db.create('interviewQuestions', { category_id, question_text: it.question_text, difficulty: it.difficulty });
        created.push(q);
      }
      return res.status(201).json({ created_count: created.length, created });
    }

    // Postgres path
    // Resolve skill name
    let skillName = '';
    let sres;
    if (skill_id) {
      try {
        sres = await pool.query('SELECT id, name FROM skills WHERE id = $1', [skill_id]);
      } catch { }
    }
    if (!sres || sres.rows.length === 0) {
      if (!skill_name) return res.status(400).json({ error: 'Invalid skill_id and no skill_name provided' });
      const sby = await pool.query('SELECT id, name FROM skills WHERE LOWER(name)=LOWER($1) LIMIT 1', [skill_name]);
      if (sby.rows.length === 0) return res.status(400).json({ error: 'Invalid skill reference' });
      sres = sby;
    }
    skillName = (sres.rows[0].name || '').trim();
    if (!skillName) return res.status(400).json({ error: 'Skill has no name' });

    // Ensure category exists (case-insensitive)
    let cat = await pool.query('SELECT id, name FROM question_categories WHERE LOWER(name)=LOWER($1)', [skillName]);
    let category_id = cat.rows[0]?.id;
    if (!category_id) {
      const ins = await pool.query('INSERT INTO question_categories (name) VALUES ($1) RETURNING id, name', [skillName]);
      category_id = ins.rows[0].id;
    }

    const created = [];
    for (const it of items) {
      const q = await pool.query(
        'INSERT INTO interview_questions (category_id, question_text, difficulty) VALUES ($1,$2,$3) RETURNING id, question_text, difficulty, created_at, updated_at',
        [category_id, it.question_text, it.difficulty]
      );
      created.push(q.rows[0]);
    }
    return res.status(201).json({ created_count: created.length, created });
  } catch (e) {
    console.error('❌ Bulk add error:', e);
    res.status(500).json({ error: 'Failed to bulk create questions', details: e.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const dbType = getDBType();
    if (dbType === 'Mongo') {
      const db = getDB();
      const exists = await db.findOne('questionCategories', { name: new RegExp(`^${name}$`, 'i') });
      if (exists) return res.status(200).json(exists);
      const cat = await db.create('questionCategories', { name });
      return res.status(201).json(cat);
    }
    const sel = await pool.query('SELECT id, name FROM question_categories WHERE LOWER(name)=LOWER($1)', [name]);
    if (sel.rows.length > 0) return res.status(200).json(sel.rows[0]);
    const ins = await pool.query('INSERT INTO question_categories (name) VALUES ($1) RETURNING id, name, created_at, updated_at', [name]);
    res.status(201).json(ins.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Questions list with pagination and filters
router.get('/', async (req, res) => {
  try {
    const dbType = getDBType();
    const { page = 1, limit = 20, category_id = '', search = '', difficulty = '' } = req.query;
    const p = parseInt(page), l = parseInt(limit);
    if (dbType === 'Mongo') {
      const db = getDB();
      const filter = {};
      if (category_id) filter.category_id = category_id;
      if (difficulty) filter.difficulty = difficulty;
      if (search) filter.question_text = new RegExp(search, 'i');
      const totalRecords = await db.count('interviewQuestions', filter);
      const items = await db.findAll('interviewQuestions', filter, {
        sort: { created_at: -1 },
        limit: l,
        skip: (p - 1) * l,
        populate: ['category_id']
      });
      return res.json({ data: items, pagination: { page: p, limit: l, totalRecords, totalPages: Math.ceil(totalRecords / l) } });
    }
    // Postgres
    const where = [];
    const params = [];
    let idx = 1;
    if (category_id) { where.push(`q.category_id = $${idx++}`); params.push(category_id); }
    if (difficulty) { where.push(`q.difficulty = $${idx++}`); params.push(difficulty); }
    if (search) { where.push(`q.question_text ILIKE $${idx++}`); params.push(`%${search}%`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const cnt = await pool.query(`SELECT COUNT(*)::int AS cnt FROM interview_questions q ${whereSql}`, params);
    const totalRecords = cnt.rows[0]?.cnt || 0;
    const off = (p - 1) * l;
    const qry = `
      SELECT q.id, q.question_text, q.difficulty, q.created_at, q.updated_at,
             json_build_object('id', c.id, 'name', c.name) as category_id
      FROM interview_questions q
      LEFT JOIN question_categories c ON c.id = q.category_id
      ${whereSql}
      ORDER BY q.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const items = await pool.query(qry, [...params, l, off]);
    res.json({ data: items.rows, pagination: { page: p, limit: l, totalRecords, totalPages: Math.ceil(totalRecords / l) } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { category_id, question_text, difficulty } = req.body;
    if (!category_id || !question_text) return res.status(400).json({ error: 'Category and question text are required' });
    const diff = ['Low', 'Medium', 'High'].includes(difficulty) ? difficulty : 'Low';
    const dbType = getDBType();
    if (dbType === 'Mongo') {
      const db = getDB();
      const q = await db.create('interviewQuestions', { category_id, question_text, difficulty: diff });
      return res.status(201).json(q);
    }
    const ins = await pool.query(
      `INSERT INTO interview_questions (category_id, question_text, difficulty) VALUES ($1,$2,$3) RETURNING id, question_text, difficulty, created_at, updated_at`,
      [category_id, question_text, diff]
    );
    res.status(201).json(ins.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, question_text, difficulty } = req.body;
    const dbType = getDBType();
    if (dbType === 'Mongo') {
      const db = getDB();
      const update = { updated_at: new Date() };
      if (category_id !== undefined) update.category_id = category_id;
      if (question_text !== undefined) update.question_text = question_text;
      if (difficulty !== undefined) update.difficulty = ['Low', 'Medium', 'High'].includes(difficulty) ? difficulty : 'Low';
      const updated = await db.update('interviewQuestions', id, update);
      if (!updated) return res.status(404).json({ error: 'Question not found' });
      return res.json(updated);
    }
    // Postgres
    const fields = [];
    const params = [];
    let idx = 1;
    if (category_id !== undefined) { fields.push(`category_id = $${idx++}`); params.push(category_id); }
    if (question_text !== undefined) { fields.push(`question_text = $${idx++}`); params.push(question_text); }
    if (difficulty !== undefined) { fields.push(`difficulty = $${idx++}`); params.push(['Low', 'Medium', 'High'].includes(difficulty) ? difficulty : 'Low'); }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    const sql = `UPDATE interview_questions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(sql, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbType = getDBType();
    if (dbType === 'Mongo') {
      const db = getDB();
      const del = await db.delete('interviewQuestions', id);
      if (!del) return res.status(404).json({ error: 'Question not found' });
      return res.json({ message: 'Question deleted' });
    }
    const result = await pool.query('DELETE FROM interview_questions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
