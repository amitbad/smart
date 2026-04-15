-- 004_alter_members_level_text.sql
-- Change members.level from INTEGER to VARCHAR to allow alphanumeric (e.g., A1)

BEGIN;

-- Drop existing index if any (from employees -> members rename)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_members_level') THEN
    EXECUTE 'DROP INDEX idx_members_level';
  END IF;
END$$;

-- Alter column type to VARCHAR(20)
ALTER TABLE members
  ALTER COLUMN level TYPE VARCHAR(20) USING level::text;

-- Recreate index on level (optional for filtering)
CREATE INDEX IF NOT EXISTS idx_members_level ON members(level);

COMMIT;
