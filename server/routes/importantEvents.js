import express from 'express';
import { getDB, getDBType } from '../db/index.js';
import { encryptUrl, safeDecryptUrl } from '../utils/encryption.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, source, activeOnly } = req.query;
    const db = getDB();
    const dbType = getDBType();

    let filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;

    if (activeOnly === 'true') {
      filter.status = 'Active';
    }

    let events;
    if (dbType === 'Mongo') {
      events = await db.findAll('importantEvents', filter, { sort: { start_date: 1, created_at: -1 } });
    } else {
      return res.status(501).json({ error: 'Important Events currently support MongoDB path in this route' });
    }

    const decryptedEvents = events.map((event) => ({
      ...event,
      event_link: safeDecryptUrl(event.event_link)
    }));

    res.json(decryptedEvents);
  } catch (error) {
    console.error('Error fetching important events:', error);
    res.status(500).json({ error: 'Failed to fetch important events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_name, subject_line, event_link, source, start_date, end_date, event_time, status } = req.body;

    if (!event_name || !start_date) {
      return res.status(400).json({ error: 'Event name and start date are required' });
    }

    const db = getDB();
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Important Events currently support MongoDB path in this route' });
    }

    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : null;

    if (endDateObj && endDateObj < startDateObj) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const created = await db.create('importantEvents', {
      event_name: event_name.trim(),
      subject_line: subject_line?.trim() || '',
      event_link: event_link?.trim() ? encryptUrl(event_link.trim()) : '',
      source: source || 'Internal',
      start_date: startDateObj,
      end_date: endDateObj,
      event_time: event_time?.trim() || '',
      status: status || 'Active',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      ...created,
      event_link: safeDecryptUrl(created.event_link)
    });
  } catch (error) {
    console.error('Error creating important event:', error);
    res.status(500).json({ error: 'Failed to create important event' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, subject_line, event_link, source, start_date, end_date, event_time, status } = req.body;

    if (!event_name || !start_date) {
      return res.status(400).json({ error: 'Event name and start date are required' });
    }

    const db = getDB();
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Important Events currently support MongoDB path in this route' });
    }

    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : null;

    if (endDateObj && endDateObj < startDateObj) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const updated = await db.update('importantEvents', id, {
      event_name: event_name.trim(),
      subject_line: subject_line?.trim() || '',
      event_link: event_link?.trim() ? encryptUrl(event_link.trim()) : '',
      source: source || 'Internal',
      start_date: startDateObj,
      end_date: endDateObj,
      event_time: event_time?.trim() || '',
      status: status || 'Active',
      updated_at: new Date()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      ...updated,
      event_link: safeDecryptUrl(updated.event_link)
    });
  } catch (error) {
    console.error('Error updating important event:', error);
    res.status(500).json({ error: 'Failed to update important event' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Important Events currently support MongoDB path in this route' });
    }

    const deleted = await db.delete('importantEvents', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting important event:', error);
    res.status(500).json({ error: 'Failed to delete important event' });
  }
});

export default router;
