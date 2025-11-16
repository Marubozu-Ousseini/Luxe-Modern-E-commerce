#!/usr/bin/env tsx
/**
 * Promote or create an admin user.
 * Usage examples:
 *   npm run make:admin -- --email admin@malafaareh.com --password NewStrongPass! --force
 *   npm run make:admin -- --email someone@example.com --role admin
 *
 * Flags:
 *   --email <email>            (required)
 *   --password <newPassword>   (optional: sets or changes password)
 *   --role <role>              (optional: default 'admin')
 *   --force                    (optional: create even if ADMIN_EMAIL differs)
 */

import 'dotenv/config';
import { createUserIfNotExists, setUserRole, setUserPassword, findUserByEmail } from '../src-server/services/userService.js';

interface Args { email?: string; password?: string; role?: string; force?: boolean; }

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email') args.email = argv[++i];
    else if (a === '--password') args.password = argv[++i];
    else if (a === '--role') args.role = argv[++i];
    else if (a === '--force') args.force = true;
  }
  return args;
}

async function main() {
  const { email, password, role, force } = parseArgs();
  if (!email) {
    console.error('Error: --email is required');
    process.exit(1);
  }
  const targetRole = (role as 'user' | 'admin' | undefined) || 'admin';

  const existing = findUserByEmail(email);
  if (!existing) {
    if (!password) {
      console.error('User does not exist. Provide --password to create new user.');
      process.exit(1);
    }
    const created = createUserIfNotExists('Administrator', email, password, targetRole === 'admin' ? 'admin' : 'user');
    console.log(`Created user: ${created.email} (role=${created.role})`);
    process.exit(0);
  }

  // Update role if needed
  if (existing.role !== targetRole) {
    const updatedRole = setUserRole(email, targetRole as any);
    console.log(`Updated role for ${email} -> ${updatedRole?.role}`);
  } else {
    console.log(`Role already ${existing.role}`);
  }

  // Update password if provided
  if (password) {
    setUserPassword(email, password);
    console.log('Password updated');
  }

  console.log('Done.');
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
