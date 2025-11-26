-- Add payment method and admin confirmation to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_confirmed BOOLEAN DEFAULT FALSE;

-- Backfill existing rows with default values if needed
UPDATE orders SET payment_method = 'on_delivery' WHERE payment_method IS NULL;
UPDATE orders SET admin_confirmed = FALSE WHERE admin_confirmed IS NULL;
