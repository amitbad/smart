-- Migration: Important Links Table
-- Create table for storing important access links

CREATE TABLE IF NOT EXISTS important_links (
  id SERIAL PRIMARY KEY,
  link_name VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_important_links_name ON important_links(link_name);
CREATE INDEX IF NOT EXISTS idx_important_links_created_at ON important_links(created_at DESC);
