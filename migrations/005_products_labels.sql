-- Add labels to products (required by produitService DB queries)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'labels'
  ) THEN
    ALTER TABLE products
      ADD COLUMN labels JSONB;
  END IF;

  -- Ensure type/default/nullability are correct.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'labels'
      AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE products
      ALTER COLUMN labels TYPE JSONB
      USING CASE
        WHEN labels IS NULL THEN '[]'::jsonb
        ELSE labels::jsonb
      END;
  END IF;

  ALTER TABLE products
    ALTER COLUMN labels SET DEFAULT '[]'::jsonb;

  UPDATE products
    SET labels = '[]'::jsonb
    WHERE labels IS NULL;

  ALTER TABLE products
    ALTER COLUMN labels SET NOT NULL;
END $$;

COMMIT;
