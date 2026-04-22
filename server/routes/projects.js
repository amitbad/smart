import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import { encrypt, safeDecrypt } from '../utils/encryption.js';

const router = express.Router();

// List projects (order by code)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const db = getDB();
    const dbType = getDBType();

    let projects;
    if (q && q.trim()) {
      if (dbType === 'Mongo') {
        projects = await db.findAll('projects', { code: new RegExp(q.trim(), 'i') }, { sort: { code: 1 } });
      } else {
        projects = await db.query('SELECT * FROM projects WHERE code ILIKE $1 ORDER BY code ASC', [`%${q.trim()}%`]);
      }
    } else {
      projects = await db.findAll('projects', {}, { sort: { code: 1 } });
    }

    const mapped = Array.isArray(projects)
      ? projects.map(p => ({ ...p, name: safeDecrypt(p.name) }))
      : (projects.rows || []).map(p => ({ ...p, name: safeDecrypt(p.name) }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { code, name, active = true, delivery_manager_id } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Project code is required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });
    const db = getDB();
    const dm = delivery_manager_id || null;
    const newProject = await db.create('projects', {
      code: code.trim(),
      name: encrypt(name.trim()),
      active: active !== false,
      delivery_manager_id: dm,
      created_at: new Date(),
      updated_at: new Date()
    });
    res.status(201).json({ ...newProject, name: name.trim() });
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) return res.status(409).json({ error: 'Project code must be unique' });
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, active, delivery_manager_id } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Project code is required' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });
    const db = getDB();
    const dm = delivery_manager_id || null;
    const updated = await db.update('projects', id, {
      code: code.trim(),
      name: encrypt(name.trim()),
      active: active !== false,
      delivery_manager_id: dm,
      updated_at: new Date()
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updated, name: name.trim() });
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) return res.status(409).json({ error: 'Project code must be unique' });
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const deleted = await db.delete('projects', id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
