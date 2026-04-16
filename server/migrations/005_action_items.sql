-- 005_action_items.sql
-- Create action_items table with required fields

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_priority') THEN
    CREATE TYPE action_priority AS ENUM ('Low','Medium','High','Critical');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
    CREATE TYPE action_status AS ENUM ('Not Started','In Progress','Completed','Deferred','Put On Hold');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS action_items (
  id SERIAL PRIMARY KEY,
  action_date DATE NOT NULL,
  description TEXT NOT NULL,
  priority action_priority NOT NULL DEFAULT 'Medium',
  status action_status NOT NULL DEFAULT 'Not Started',
  dependency_member_ids INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_items_date ON action_items(action_date);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

COMMIT;
