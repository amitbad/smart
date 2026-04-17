import express from 'express';
import { getDB } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const locations = await db.findAll('locations', {}, { sort: { name: 1 } });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const city = name?.trim();

    if (!city) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    const db = getDB();
    const existingLocations = await db.findAll('locations', {}, { sort: { name: 1 } });
    const existing = existingLocations.find(location => location.name?.toLowerCase() === city.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Location already exists' });
    }

    const location = await db.create('locations', { name: city });
    res.status(201).json(location);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Location already exists' });
    }
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const city = name?.trim();

    if (!city) {
      return res.status(400).json({ error: 'Location name is required' });
    }

    const db = getDB();
    const existingLocations = await db.findAll('locations', {}, { sort: { name: 1 } });
    const duplicate = existingLocations.find(location => location.id !== id && location.name?.toLowerCase() === city.toLowerCase());
    if (duplicate) {
      return res.status(409).json({ error: 'Location already exists' });
    }

    const updated = await db.update('locations', id, { name: city, updated_at: new Date() });
    if (!updated) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(updated);
  } catch (error) {
    if (error.code === '23505' || error.code === 11000) {
      return res.status(409).json({ error: 'Location already exists' });
    }
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const assignedMembers = await db.findAll('members', { location_id: id });
    if (assignedMembers?.length) {
      for (const member of assignedMembers) {
        await db.update('members', member.id, { location_id: null, updated_at: new Date() });
      }
    }

    const deleted = await db.delete('locations', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
