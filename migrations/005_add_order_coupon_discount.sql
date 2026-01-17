-- Add coupon and discount columns to orders (used by orderService + admin dashboard)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_applied INTEGER DEFAULT 0;

-- Backfill existing rows
UPDATE orders SET discount_applied = 0 WHERE discount_applied IS NULL;
