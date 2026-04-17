-- Migration: Add comments column to action_items table
-- Date: 2026-04-17
-- Description: Adds optional JSONB comments array for timestamped action item notes

ALTER TABLE action_items
ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN action_items.comments IS 'Array of note objects: [{"text": string, "created_at": ISO timestamp}]';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'action_items' AND column_name = 'comments';
