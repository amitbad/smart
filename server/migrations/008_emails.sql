-- 008_emails.sql
-- Email tracker table with subject, sender, received_at, priority, reply_by, reply_status

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reply_status') THEN
    CREATE TYPE reply_status AS ENUM ('Not Replied','In Progress','Replied');
  END IF;
END
$$;

-- Reuse action_priority enum created earlier for priority

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  priority action_priority NOT NULL DEFAULT 'Medium',
  reply_by DATE,
  status reply_status NOT NULL DEFAULT 'Not Replied',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on received_at can still help ordering; date filter will scan reasonably at current scale
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(priority);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

COMMIT;
