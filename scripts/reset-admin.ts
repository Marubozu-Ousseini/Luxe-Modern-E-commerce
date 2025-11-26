#!/usr/bin/env tsx
/**
 * Reset or create an admin user safely (works in DB or FS mode).
 * Usage:
 *   npm run reset-admin -- --email admin@malafaareh.com --password 'NewPass!'
 *   npm run reset-admin -- --email admin@malafaareh.com --password 'NewPass!' --create
 */
import 'dotenv/config';
import { isDbAvailable } from '../src-server/services/db.js';

function parseArgs() {
  const argv = process.argv.slice(2);
  const out: { email?: string; password?: string; create?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email') out.email = argv[++i];
    else if (a === '--password') out.password = argv[++i];
    else if (a === '--create') out.create = true;
  }
  return out;
}

async function main() {
  const { email, password, create } = parseArgs();
  if (!email || !password) {
    console.error('Error: --email and --password are required');
    process.exit(1);
  }

  if (isDbAvailable()) {
    // Use async DB-backed helpers
    const svc = await import('../src-server/services/userService.js');
    const { findUserByEmailAsync, createUserAsync, setUserPasswordAsync, setUserRoleAsync } = svc;
    const existing = await findUserByEmailAsync(email);
    if (!existing) {
      if (!create) {
        console.error(`User ${email} not found in DB. Pass --create to create as admin.`);
        process.exit(2);
      }
      const created = await createUserAsync('Administrator', email, password, 'admin');
      console.log(`Created admin user: ${created.email} (id=${created.id})`);
      process.exit(0);
    }
    await setUserPasswordAsync(email, password);
    await setUserRoleAsync(email, 'admin');
    console.log(`Updated password and role for ${email}`);
    process.exit(0);
  } else {
    // FS mode: import sync helpers
    const svc = await import('../src-server/services/userService.js');
    const { findUserByEmail, createUser, setUserPassword, setUserRole } = svc;
    const existing = findUserByEmail(email);
    if (!existing) {
      if (!create) {
        console.error(`User ${email} not found in FS store. Pass --create to create as admin.`);
        process.exit(2);
      }
      const created = createUser('Administrator', email, password, 'admin');
      console.log(`Created admin user: ${created.email} (id=${created.id})`);
      process.exit(0);
    }
    setUserPassword(email, password);
    setUserRole(email, 'admin');
    console.log(`Updated password and role for ${email} (FS store)`);
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
