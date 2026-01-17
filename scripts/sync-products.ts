import { fileURLToPath } from 'url';
import path from 'path';

import { query } from '../src-server/services/db.js';
import { getAllProducts } from '../src-server/services/produitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeLabels(labels: unknown): string[] {
  if (Array.isArray(labels)) return labels.filter(x => typeof x === 'string') as string[];
  return [];
}

async function ensureSchema() {
  // Helpful early error if migrations weren’t applied.
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'labels'
    ) as exists`
  );

  if (!rows[0]?.exists) {
    throw new Error(
      "products.labels column is missing. Run migrations first (npm run migrate) so produitService can query labels."
    );
  }
}

async function syncProducts() {
  await ensureSchema();

  const products = getAllProducts();
  if (!products.length) {
    console.log('[sync-products] No products found in backend source list; nothing to do.');
    return;
  }

  console.log(`[sync-products] Syncing ${products.length} products into DB...`);

  await query('BEGIN');
  try {
    for (const product of products) {
      if (product.id == null) throw new Error('Encountered product with missing id');

      const ratingRate = product.rating?.rate ?? 0;
      const ratingCount = product.rating?.count ?? 0;
      const labels = normalizeLabels((product as any).labels);

      await query(
        `INSERT INTO products (
          id,
          name,
          price,
          original_price,
          description,
          category,
          image_url,
          stock,
          limited_availability,
          rating_rate,
          rating_count,
          labels
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          image_url = EXCLUDED.image_url,
          stock = EXCLUDED.stock,
          limited_availability = EXCLUDED.limited_availability,
          rating_rate = EXCLUDED.rating_rate,
          rating_count = EXCLUDED.rating_count,
          labels = EXCLUDED.labels`,
        [
          product.id,
          product.name,
          product.price,
          product.originalPrice ?? null,
          product.description,
          product.category,
          product.imageUrl,
          (product as any).stock ?? 0,
          (product as any).limitedAvailability ?? false,
          ratingRate,
          ratingCount,
          JSON.stringify(labels),
        ]
      );
    }

    // Keep SERIAL sequence (if any) in sync when we insert explicit IDs.
    await query(
      `SELECT setval(
        pg_get_serial_sequence('products','id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM products), 1)
      )`
    );

    await query('COMMIT');
  } catch (e) {
    await query('ROLLBACK');
    throw e;
  }

  console.log(`[sync-products] Done. DB now has at least ${products.length} products by id.`);
}

syncProducts().catch(err => {
  console.error('[sync-products] Failed:', err);
  process.exit(1);
});
