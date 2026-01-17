import { query } from '../src-server/services/db.js';

type Options = {
  yes: boolean;
  catalog: boolean;
  resetCarts: boolean;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    yes: false,
    catalog: false,
    resetCarts: false,
  };

  for (const arg of argv) {
    if (arg === '--yes' || arg === '--confirm') options.yes = true;
    else if (arg === '--catalog') options.catalog = true;
    else if (arg === '--reset-carts') options.resetCarts = true;
    else if (arg === '--help' || arg === '-h') {
      printUsageAndExit(0);
    }
  }

  return options;
}

function printUsageAndExit(exitCode: number): never {
  // Keep this simple: script is used both locally (tsx) and in Cloud Run Jobs (node dist/...)
  console.log(`\nUsage:\n  node dist/scripts/reset-db.js [--catalog] [--reset-carts] (--yes|RESET_DB_CONFIRM=YES)\n\nOptions:\n  --catalog        Truncate products + orders + order_items (RESTART IDENTITY, CASCADE)\n  --reset-carts    Reset users.cart to [] (if column exists)\n  --yes            Required to run destructive actions\n\nSafety:\n  Set env RESET_DB_CONFIRM=YES or pass --yes to actually execute changes.\n`);
  process.exit(exitCode);
}

async function tableExists(tableName: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists`,
    [tableName]
  );
  return Boolean(rows[0]?.exists);
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists`,
    [tableName, columnName]
  );
  return Boolean(rows[0]?.exists);
}

async function resetCatalog(): Promise<void> {
  const candidates = ['order_items', 'orders', 'products'];
  const existing: string[] = [];
  for (const table of candidates) {
    if (await tableExists(table)) existing.push(table);
  }

  if (!existing.length) {
    console.log('[reset-db] No catalog tables found; nothing to do.');
    return;
  }

  const sql = `TRUNCATE TABLE ${existing.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`;
  console.log(`[reset-db] Running: ${sql}`);
  await query(sql);
  console.log('[reset-db] Catalog tables truncated.');
}

async function resetUserCarts(): Promise<void> {
  if (!(await tableExists('users'))) {
    console.log('[reset-db] users table not found; skipping cart reset.');
    return;
  }
  if (!(await columnExists('users', 'cart'))) {
    console.log('[reset-db] users.cart column not found; skipping cart reset.');
    return;
  }

  console.log("[reset-db] Resetting users.cart to '[]'::jsonb");
  await query(`UPDATE users SET cart = '[]'::jsonb WHERE cart IS DISTINCT FROM '[]'::jsonb;`);
  console.log('[reset-db] User carts reset.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const confirmed = options.yes || process.env.RESET_DB_CONFIRM === 'YES';
  const hasWork = options.catalog || options.resetCarts;

  if (!hasWork) {
    console.log('[reset-db] Nothing selected. Use --help for options.');
    process.exit(0);
  }

  if (!confirmed) {
    console.error(
      '[reset-db] Refusing to run without confirmation. Pass --yes or set RESET_DB_CONFIRM=YES.'
    );
    process.exit(2);
  }

  await query('BEGIN');
  try {
    if (options.catalog) await resetCatalog();
    if (options.resetCarts) await resetUserCarts();
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

main().catch(err => {
  console.error('[reset-db] Failed:', err);
  process.exit(1);
});
