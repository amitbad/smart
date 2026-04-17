import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

// List all goals with optional filters
router.get('/', async (req, res) => {
  try {
    const { year, member_id } = req.query;
    const db = getDB();
    
    let filter = {};
    if (year) filter.year = parseInt(year);
    if (member_id) filter.member_id = member_id;
    
    const goals = await db.findAll('goals', filter, { sort: { year: -1, created_at: -1 } });
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get goal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const goal = await db.findOne('goals', { id });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create new goal
router.post('/', async (req, res) => {
  try {
    const { member_id, year, goal_text, description, status, category_ids } = req.body;
    
    if (!member_id || !year || !goal_text) {
      return res.status(400).json({ error: 'Member, year, and goal text are required' });
    }
    
    const db = getDB();
    const newGoal = await db.create('goals', {
      member_id,
      year: parseInt(year),
      goal_text,
      description: description || '',
      status: status || 'pending',
      category_ids: category_ids || []
    });
    
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, year, goal_text, description, status, category_ids } = req.body;
    
    if (!goal_text) {
      return res.status(400).json({ error: 'Goal text is required' });
    }
    
    const db = getDB();
    const updated = await db.update('goals', id, {
      member_id,
      year: year ? parseInt(year) : undefined,
      goal_text,
      description,
      status,
      category_ids
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal with status validation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // Get goal to check status
    const goal = await db.findOne('goals', { id });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Block deletion if goal is complete or inprogress
    if (goal.status === 'complete' || goal.status === 'inprogress') {
      return res.status(400).json({ 
        error: 'Cannot delete goal',
        message: `Goal is ${goal.status}. Only pending or deferred goals can be deleted.`,
        status: goal.status
      });
    }
    
    const deleted = await db.delete('goals', id);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
