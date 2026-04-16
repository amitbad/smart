-- 009_bench.sql
-- Bench management table to track member project assignments

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bench_status') THEN
    CREATE TYPE bench_status AS ENUM ('Working','Project Completed','Deferred');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS bench (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  assigned_date DATE NOT NULL,
  release_date DATE,
  extension_date DATE,
  status bench_status NOT NULL DEFAULT 'Working',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bench_member ON bench(member_id);
CREATE INDEX IF NOT EXISTS idx_bench_project ON bench(project_id);
CREATE INDEX IF NOT EXISTS idx_bench_status ON bench(status);

COMMIT;
