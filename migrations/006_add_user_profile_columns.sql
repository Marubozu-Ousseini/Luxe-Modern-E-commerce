-- Ensure users table has columns expected by DB-backed services

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS town TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS rewards_points INTEGER DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vouchers JSONB DEFAULT '[]'::jsonb;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS favorites INTEGER[] DEFAULT '{}';

-- cart column is added by 003_add_cart_column.sql, but keep this migration safe if 003 wasn't applied.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;

-- Backfill nulls
UPDATE users SET rewards_points = 0 WHERE rewards_points IS NULL;
UPDATE users SET vouchers = '[]'::jsonb WHERE vouchers IS NULL;
UPDATE users SET favorites = '{}' WHERE favorites IS NULL;
UPDATE users SET cart = '[]'::jsonb WHERE cart IS NULL;
