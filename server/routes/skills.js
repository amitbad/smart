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

router.get('/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if skill is assigned to any members
    const assignments = await db.findAll('memberSkills', { skill_id: id });
    const isAssigned = assignments && assignments.length > 0;

    res.json({
      isAssigned,
      count: isAssigned ? assignments.length : 0
    });
  } catch (error) {
    console.error('Error checking skill assignments:', error);
    res.status(500).json({ error: 'Failed to check skill assignments' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const db = getDB();
    const updated = await db.update('skills', id, { name });

    if (!updated) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json(updated);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Skill name already exists' });
    }
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if skill is assigned to any members
    const assignments = await db.findAll('memberSkills', { skill_id: id });
    const isAssigned = assignments && assignments.length > 0;

    // Delete skill assignments first if any
    if (isAssigned) {
      await db.delete('memberSkills', { skill_id: id });
    }

    // Delete the skill
    const deleted = await db.delete('skills', id);

    if (!deleted) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      message: 'Skill deleted successfully',
      wasAssigned: isAssigned,
      unassignedCount: isAssigned ? assignments.length : 0
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
