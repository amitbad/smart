import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import { encryptUrl, safeDecryptUrl } from '../utils/encryption.js';

const router = express.Router();

// List with filters and grouping by date (client can group)
router.get('/', async (req, res) => {
  try {
    const { date, priority, status, dependency } = req.query;
    const db = getDB();
    const dbType = getDBType();

    const filter = {};
    if (date) filter.action_date = new Date(date);
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (dependency) filter.dependency_member_id = dependency;

    const actionItems = await db.findAll('actionItems', filter, { sort: { action_date: -1, created_at: -1 } });

    // Decrypt reference links before sending to client (handles both encrypted and plain text)
    const decryptedItems = actionItems.map(item => ({
      ...item,
      reference_link: item.reference_link ? safeDecryptUrl(item.reference_link) : null
    }));

    res.json(decryptedItems);
  } catch (err) {
    console.error('Error fetching action items:', err);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { action_date, description, priority, status, dependency_member_id, reference_link, comments } = req.body;
    if (!action_date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }
    const db = getDB();

    // Encrypt reference link if provided
    const encryptedLink = reference_link ? encryptUrl(reference_link) : null;

    const newItem = await db.create('actionItems', {
      action_date: new Date(action_date),
      description,
      priority: priority || 'Medium',
      status: status || 'Pending',
      dependency_member_id: dependency_member_id || null,
      reference_link: encryptedLink,
      comments: Array.isArray(comments) ? comments : []
    });

    // Decrypt reference link before sending response
    if (newItem.reference_link) {
      newItem.reference_link = safeDecryptUrl(newItem.reference_link);
    }

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating action item:', err);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_date, description, priority, status, dependency_member_id, reference_link, comments } = req.body;
    const db = getDB();

    const updateData = { updated_at: new Date() };
    if (action_date) updateData.action_date = new Date(action_date);
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (dependency_member_id !== undefined) updateData.dependency_member_id = dependency_member_id || null;
    if (comments !== undefined) updateData.comments = Array.isArray(comments) ? comments : [];
    if (reference_link !== undefined) {
      // Encrypt reference link if provided, otherwise set to null
      updateData.reference_link = reference_link ? encryptUrl(reference_link) : null;
    }

    const updated = await db.update('actionItems', id, updateData);
    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Decrypt reference link before sending response
    if (updated.reference_link) {
      updated.reference_link = safeDecryptUrl(updated.reference_link);
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating action item:', err);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const db = getDB();
    const dbType = getDBType();
    const newComment = {
      text: text.trim(),
      created_at: new Date()
    };

    if (dbType === 'Mongo') {
      const item = await db.findById('actionItems', id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      const updatedComments = [...(item.comments || []), newComment];
      const updated = await db.update('actionItems', id, {
        comments: updatedComments,
        updated_at: new Date()
      });
      if (updated.reference_link) {
        updated.reference_link = safeDecryptUrl(updated.reference_link);
      }
      return res.json(updated);
    }

    return res.status(501).json({ error: 'PostgreSQL path not implemented for action item comments in this route' });
  } catch (err) {
    console.error('Error adding action item comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const db = getDB();
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'PostgreSQL path not implemented for action item comments in this route' });
    }

    const item = await db.findById('actionItems', id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot edit notes for a completed action item' });
    }

    const updatedComments = (item.comments || []).map(comment => {
      const currentId = comment._id?.toString?.() || comment.id?.toString?.();
      if (currentId === commentId) {
        return { ...comment, text: text.trim() };
      }
      return comment;
    });

    const updated = await db.update('actionItems', id, {
      comments: updatedComments,
      updated_at: new Date()
    });
    if (updated.reference_link) {
      updated.reference_link = safeDecryptUrl(updated.reference_link);
    }
    return res.json(updated);
  } catch (err) {
    console.error('Error updating action item comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const db = getDB();
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'PostgreSQL path not implemented for action item comments in this route' });
    }

    const item = await db.findById('actionItems', id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot delete notes for a completed action item' });
    }

    const updatedComments = (item.comments || []).filter(comment => {
      const currentId = comment._id?.toString?.() || comment.id?.toString?.();
      return currentId !== commentId;
    });

    const updated = await db.update('actionItems', id, {
      comments: updatedComments,
      updated_at: new Date()
    });
    if (updated.reference_link) {
      updated.reference_link = safeDecryptUrl(updated.reference_link);
    }
    return res.json(updated);
  } catch (err) {
    console.error('Error deleting action item comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Prevent delete if Completed
    const item = await db.findById('actionItems', id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (item.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot delete a Completed action item' });
    }

    await db.delete('actionItems', id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting action item:', err);
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});

export default router;
