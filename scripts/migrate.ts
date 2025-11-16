import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src-server/services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

async function run() {
  const files = fs.readdirSync(migrationsDir).filter(f => /\.sql$/.test(f)).sort();
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf-8');
    console.log(`[migrate] Applying ${file}`);
    await query(sql);
  }
  console.log('[migrate] All migrations applied');
}

run().catch(e => {
  console.error('[migrate] Failed:', e);
  process.exit(1);
});
