import { Pool } from 'pg';

// Use single DATABASE_URL if available, else assemble from discrete vars or IAM auth
const databaseUrl = process.env.DATABASE_URL;

let pool: Pool;
let connected = false;
async function buildPool() {
  if (process.env.DB_IAM_AUTH === 'true' && process.env.INSTANCE_CONNECTION_NAME) {
    try {
      const mod = await import('@google-cloud/cloud-sql-connector');
      const connector = new mod.Connector();
      const opts = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
      });
      pool = new Pool({
        ...opts,
        database: process.env.PGDATABASE || 'luxe_db',
      });
    } catch (e) {
      console.warn('[db] IAM auth requested but @google-cloud/cloud-sql-connector not available, falling back to socket/password:', (e as Error).message);
    }
  } else if (databaseUrl) {
    pool = new Pool({ connectionString: databaseUrl });
  } else {
    pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'luxe_db',
      port: Number(process.env.PGPORT) || 5432,
    });
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  if (!pool) await buildPool();
  const res = await pool.query(text, params);
  return { rows: res.rows as T[] };
}

export async function initDb(): Promise<void> {
  // Simple connectivity check; migrations handled externally
  try {
    if (!pool) await buildPool();
    await pool.query('SELECT 1');
    connected = true;
  } catch (e) {
    console.warn('[db] Connection failed, falling back to in-memory services:', (e as Error).message);
  }
}

export function isDbAvailable(): boolean {
  // DB considered available only after successful connectivity init
  if (process.env.NODE_ENV === 'test') return false;
  return !!databaseUrl && connected;
}

export async function closeDb(): Promise<void> {
  if (pool) await pool.end();
}
