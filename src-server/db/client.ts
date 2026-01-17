import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Connector } from '@google-cloud/cloud-sql-connector';

// Prefer IAM auth if enabled and running on Cloud Run with INSTANCE_CONNECTION_NAME
async function makePool(): Promise<Pool> {
  if (process.env.DB_IAM_AUTH === 'true' && process.env.INSTANCE_CONNECTION_NAME) {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
      // authType IAM by default for Postgres
    });
    return new Pool({
      ...clientOpts,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || undefined,
      database: process.env.PGDATABASE || 'luxe_db',
    });
  }
  // Fallback to password / unix socket or TCP env vars
  if (process.env.DATABASE_URL) {
    return new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'luxe_db',
    port: Number(process.env.PGPORT) || 5432,
  });
}

let _poolPromise: Promise<Pool> | null = null;
export function getPool(): Promise<Pool> {
  if (!_poolPromise) _poolPromise = makePool();
  return _poolPromise;
}

let _drizzlePromise: Promise<ReturnType<typeof drizzle>> | null = null;
export function getDrizzle() {
  if (!_drizzlePromise) {
    _drizzlePromise = getPool().then(pool => drizzle(pool));
  }
  return _drizzlePromise;
}
