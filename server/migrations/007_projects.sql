-- 007_projects.sql
-- Create projects master table with unique alphanumeric code and optional delivery manager

BEGIN;

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  delivery_manager_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_dm ON projects(delivery_manager_id);

COMMIT;
