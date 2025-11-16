import { Pool } from 'pg';

// Use single DATABASE_URL if available, else assemble from discrete vars
const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl } 
    : {
        host: process.env.PGHOST || 'localhost',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'luxe_db',
        port: Number(process.env.PGPORT) || 5432,
      }
);

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const res = await pool.query(text, params);
  return { rows: res.rows as T[] };
}

export async function initDb(): Promise<void> {
  // Simple connectivity check; migrations handled externally
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    // Fail silently in dev when DB not present, allowing in-memory fallback
    console.warn('[db] Connection failed, falling back to in-memory services:', (e as Error).message);
  }
}

export function isDbAvailable(): boolean {
  // Heuristic: if DATABASE_URL set, assume intended to use DB
  return !!databaseUrl;
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
