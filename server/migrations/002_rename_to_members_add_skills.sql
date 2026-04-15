-- Migration: 002_rename_to_members_add_skills
-- Description: Rename employees to members and add skills system
-- Date: 2026-04-15

-- Rename employees table to members
ALTER TABLE IF EXISTS employees RENAME TO members;

-- Rename indexes
ALTER INDEX IF EXISTS idx_employees_manager_id RENAME TO idx_members_manager_id;
ALTER INDEX IF EXISTS idx_employees_level RENAME TO idx_members_level;

-- Update foreign key constraint name (PostgreSQL auto-renames, but let's be explicit)
-- The constraint will automatically reference the renamed table

-- Make email unique and not null in members table
ALTER TABLE members 
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT members_email_unique UNIQUE (email);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on skill name
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- Create member_skills junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS member_skills (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, skill_id)
);

-- Create indexes for member_skills
CREATE INDEX IF NOT EXISTS idx_member_skills_member_id ON member_skills(member_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_skill_id ON member_skills(skill_id);

-- Make email unique in users table (not null already exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(320) UNIQUE;

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('002_rename_to_members_add_skills')
ON CONFLICT (migration_name) DO NOTHING;
