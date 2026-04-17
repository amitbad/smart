import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

// List all goal categories (alphabetical)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.findAll('goalCategories', {}, { sort: { name: 1 } });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching goal categories:', error);
    res.status(500).json({ error: 'Failed to fetch goal categories' });
  }
});

// Create new goal category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const db = getDB();
    const newCategory = await db.create('goalCategories', { name: name.trim() });
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Error creating goal category:', error);
    res.status(500).json({ error: 'Failed to create goal category' });
  }
});

// Check if category is assigned to goals
router.get('/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if category is assigned to any goals
    const assignments = await db.findAll('goals', { category_ids: id });
    const isAssigned = assignments && assignments.length > 0;

    res.json({
      isAssigned,
      count: isAssigned ? assignments.length : 0
    });
  } catch (error) {
    console.error('Error checking category assignments:', error);
    res.status(500).json({ error: 'Failed to check category assignments' });
  }
});

// Update goal category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const db = getDB();
    const updated = await db.update('goalCategories', id, { name: name.trim() });
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    console.error('Error updating goal category:', error);
    res.status(500).json({ error: 'Failed to update goal category' });
  }
});

// Delete goal category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if category is assigned to any goals
    const assignments = await db.findAll('goals', { category_ids: id });
    const isAssigned = assignments && assignments.length > 0;

    // Remove category from all goals if assigned
    if (isAssigned) {
      for (const goal of assignments) {
        const updatedCategories = goal.category_ids.filter(catId => catId.toString() !== id.toString());
        await db.update('goals', goal.id, { category_ids: updatedCategories });
      }
    }

    // Delete the category
    const deleted = await db.delete('goalCategories', id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });

    res.json({
      message: 'Deleted',
      wasAssigned: isAssigned,
      unassignedCount: isAssigned ? assignments.length : 0
    });
  } catch (error) {
    console.error('Error deleting goal category:', error);
    res.status(500).json({ error: 'Failed to delete goal category' });
  }
});

export default router;
