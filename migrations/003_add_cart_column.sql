-- Add cart JSONB column to users for server-side cart persistence
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;

COMMIT;
