import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import { encryptUrl, safeDecryptUrl } from '../utils/encryption.js';

const router = express.Router();

// List all important links with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const db = getDB();
    const dbType = getDBType();

    let links;
    if (search && search.trim()) {
      if (dbType === 'Mongo') {
        const regex = new RegExp(search.trim(), 'i');
        links = await db.findAll('importantLinks', {
          $or: [
            { link_name: regex },
            { purpose: regex },
            { created_by: regex }
          ]
        }, { sort: { created_at: -1 } });
      } else {
        links = await db.query(
          'SELECT * FROM important_links WHERE link_name ILIKE $1 OR purpose ILIKE $1 OR created_by ILIKE $1 ORDER BY created_at DESC',
          [`%${search.trim()}%`]
        );
      }
    } else {
      links = await db.findAll('importantLinks', {}, { sort: { created_at: -1 } });
    }

    // Decrypt URLs before sending to client (handles both encrypted and plain text)
    const decryptedLinks = links.map(link => ({
      ...link,
      link_url: safeDecryptUrl(link.link_url)
    }));

    res.json(decryptedLinks);
  } catch (error) {
    console.error('Error fetching important links:', error);
    res.status(500).json({ error: 'Failed to fetch important links' });
  }
});

// Get single link by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const link = await db.findById('importantLinks', id);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Decrypt URL before sending
    link.link_url = safeDecryptUrl(link.link_url);

    res.json(link);
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

// Create new important link
router.post('/', async (req, res) => {
  try {
    const { link_name, link_url, purpose, created_by } = req.body;

    if (!link_name || !link_url) {
      return res.status(400).json({ error: 'Link name and URL are required' });
    }

    const db = getDB();

    // Encrypt URL before storing
    const encryptedUrl = encryptUrl(link_url);

    const newLink = await db.create('importantLinks', {
      link_name,
      link_url: encryptedUrl,
      purpose: purpose || null,
      created_by: created_by || null
    });

    // Decrypt URL before sending response
    newLink.link_url = safeDecryptUrl(newLink.link_url);

    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Update important link
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { link_name, link_url, purpose, created_by } = req.body;

    if (!link_name || !link_url) {
      return res.status(400).json({ error: 'Link name and URL are required' });
    }

    const db = getDB();

    // Encrypt URL before storing
    const encryptedUrl = encryptUrl(link_url);

    const updated = await db.update('importantLinks', id, {
      link_name,
      link_url: encryptedUrl,
      purpose: purpose || null,
      created_by: created_by || null,
      updated_at: new Date()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Decrypt URL before sending response
    updated.link_url = safeDecryptUrl(updated.link_url);

    res.json(updated);
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// Delete important link
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const deleted = await db.delete('importantLinks', id);

    if (!deleted) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;
