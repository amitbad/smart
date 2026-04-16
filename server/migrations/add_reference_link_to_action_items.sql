-- Migration: Add reference_link column to action_items table
-- Date: 2026-04-16
-- Description: Adds an optional reference_link field to store encrypted URLs for action items

-- Add the reference_link column (nullable, for optional links)
ALTER TABLE action_items 
ADD COLUMN IF NOT EXISTS reference_link TEXT DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN action_items.reference_link IS 'Encrypted reference URL for the action item (optional)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'action_items' AND column_name = 'reference_link';
