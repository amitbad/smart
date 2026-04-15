-- 003_add_designations.sql
-- Create a master list for designations and backfill from existing members

BEGIN;

CREATE TABLE IF NOT EXISTS designations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backfill from existing members.designation (non-null, non-empty)
INSERT INTO designations (name)
SELECT DISTINCT TRIM(designation)
FROM members
WHERE designation IS NOT NULL AND TRIM(designation) <> ''
ON CONFLICT (name) DO NOTHING;

COMMIT;
