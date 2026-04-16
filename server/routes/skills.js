import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const skills = await db.findAll('skills', {}, { sort: { name: 1 } });
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const db = getDB();
    const newSkill = await db.create('skills', { name });
    res.status(201).json(newSkill);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Skill already exists' });
    }
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const deleted = await db.delete('skills', id);

    if (!deleted) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
