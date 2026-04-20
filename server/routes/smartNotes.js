import express from 'express';
import { getDB, getDBType } from '../db/index.js';

const router = express.Router();

function stripLeadingNumbering(text) {
  return (text || '').replace(/^\s*(\d+[\.)]\s*)+/, '').trim();
}

function parseActionLines(content = '') {
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ raw: line, index }))
    .filter(({ raw }) => raw.includes('@action_item'))
    .map(({ raw, index }) => {
      const text = stripLeadingNumbering(raw.replace(/@action_item/gi, '').trim());
      return {
        line_key: `${index}-${text.toLowerCase()}`,
        text,
        line_number: index + 1
      };
    })
    .filter(item => item.text);
}

function serializeNote(note) {
  return {
    ...note,
    detected_actions: Array.isArray(note.parsed_actions)
      ? note.parsed_actions.map(action => ({
        line_key: action.line_key,
        text: action.text,
        action_item_id: action.action_item_id || null
      }))
      : []
  };
}

async function syncNoteActions(db, note, parsedActions) {
  const previousActions = Array.isArray(note.parsed_actions) ? note.parsed_actions : [];
  const previousByKey = new Map(previousActions.map(action => [action.line_key, action]));
  const nextParsedActions = [];

  for (const parsed of parsedActions) {
    const existing = previousByKey.get(parsed.line_key);
    if (existing?.action_item_id) {
      await db.update('actionItems', existing.action_item_id, {
        description: parsed.text,
        action_date: new Date(note.note_date),
        priority: 'Medium',
        status: 'Not Started',
        updated_at: new Date()
      });
      nextParsedActions.push({
        line_key: parsed.line_key,
        text: parsed.text,
        action_item_id: existing.action_item_id
      });
      previousByKey.delete(parsed.line_key);
      continue;
    }

    const newActionItem = await db.create('actionItems', {
      action_date: new Date(note.note_date),
      description: parsed.text,
      priority: 'Medium',
      status: 'Not Started',
      dependency_member_id: null,
      reference_link: null,
      comments: []
    });

    nextParsedActions.push({
      line_key: parsed.line_key,
      text: parsed.text,
      action_item_id: newActionItem.id
    });
  }

  for (const removed of previousByKey.values()) {
    if (!removed.action_item_id) continue;
    const actionItem = await db.findById('actionItems', removed.action_item_id);
    if (actionItem && actionItem.status !== 'Completed') {
      await db.delete('actionItems', removed.action_item_id);
    } else if (actionItem) {
      nextParsedActions.push({
        line_key: removed.line_key,
        text: removed.text,
        action_item_id: removed.action_item_id
      });
    }
  }

  return nextParsedActions;
}

router.get('/', async (req, res) => {
  try {
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Smart Notes are currently supported only with MongoDB' });
    }

    const db = getDB();
    const notes = await db.findAll('smartNotes', {}, { sort: { note_date: -1, created_at: -1 }, limit: 50 });
    res.json(notes.map(serializeNote));
  } catch (error) {
    console.error('Error fetching smart notes:', error);
    res.status(500).json({ error: 'Failed to fetch smart notes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Smart Notes are currently supported only with MongoDB' });
    }

    const { title, content, note_date } = req.body;
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const db = getDB();
    const note = await db.create('smartNotes', {
      title: title?.trim() || '',
      content: trimmedContent,
      note_date: note_date ? new Date(note_date) : new Date(),
      parsed_actions: [],
      created_at: new Date(),
      updated_at: new Date()
    });

    const parsedActions = parseActionLines(trimmedContent);
    const syncedActions = await syncNoteActions(db, note, parsedActions);
    const updatedNote = await db.update('smartNotes', note.id, {
      parsed_actions: syncedActions,
      updated_at: new Date()
    });

    res.status(201).json(serializeNote(updatedNote));
  } catch (error) {
    console.error('Error creating smart note:', error);
    res.status(500).json({ error: 'Failed to save smart note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const dbType = getDBType();
    if (dbType !== 'Mongo') {
      return res.status(501).json({ error: 'Smart Notes are currently supported only with MongoDB' });
    }

    const { id } = req.params;
    const { title, content, note_date } = req.body;
    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const db = getDB();
    const existingNote = await db.findById('smartNotes', id);
    if (!existingNote) {
      return res.status(404).json({ error: 'Smart note not found' });
    }

    const baseUpdatedNote = await db.update('smartNotes', id, {
      title: title?.trim() || '',
      content: trimmedContent,
      note_date: note_date ? new Date(note_date) : existingNote.note_date,
      updated_at: new Date()
    });

    const parsedActions = parseActionLines(trimmedContent);
    const syncedActions = await syncNoteActions(db, baseUpdatedNote, parsedActions);
    const finalNote = await db.update('smartNotes', id, {
      parsed_actions: syncedActions,
      updated_at: new Date()
    });

    res.json(serializeNote(finalNote));
  } catch (error) {
    console.error('Error updating smart note:', error);
    res.status(500).json({ error: 'Failed to update smart note' });
  }
});

export default router;
