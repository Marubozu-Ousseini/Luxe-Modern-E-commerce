import bcrypt from 'bcryptjs';
import { query, isDbAvailable } from './db.js';
import { findUserByEmail, findUserByEmailAsync, createUser, UserRecord } from './userService.js';
import * as firestoreService from './firestoreService.js';

export type Role = 'user' | 'admin';

// Upsert user based on Firebase identity. Uses Firebase UID as `id` and email as unique key.
export async function upsertFirebaseUserAsync(id: string, email: string, name?: string, role: Role = 'user'): Promise<UserRecord> {
  if (process.env.USE_FIRESTORE === 'true') {
    const existing = await firestoreService.findUserByEmailFs(email);
    const payload = {
      id,
      email: email.toLowerCase(),
      name: name || existing?.name || '',
      role: role || (existing?.role as any) || 'user',
      passwordHash: existing?.passwordHash || `firebase:${id}`,
    } as any;
    // Merge into Firestore
    await firestoreService.createUserFs(payload);
    const merged = await firestoreService.findUserByEmailFs(email);
    return {
      id: (merged as any)?.id || id,
      email: (merged as any)?.email || email.toLowerCase(),
      name: (merged as any)?.name || name || '',
      role: ((merged as any)?.role as Role) || role || 'user',
      passwordHash: (merged as any)?.passwordHash || `firebase:${id}`,
      rewardsPoints: (merged as any)?.rewardsPoints,
      vouchers: (merged as any)?.vouchers,
      favorites: (merged as any)?.favorites,
      cart: (merged as any)?.cart,
    } as UserRecord;
  }
  if (!isDbAvailable()) {
    // Filesystem mode: create if not exists, using a placeholder password
    const existing = findUserByEmail(email);
    if (existing) {
      existing.name = name || existing.name;
      existing.role = role || existing.role;
      return existing;
    }
    const idToUse = id || String(Date.now());
    const passwordHash = bcrypt.hashSync(`firebase:${idToUse}`, 10);
    return createUser(name || '', email.toLowerCase(), passwordHash, role);
  }
  // DB mode: insert or update on conflict (email)
  const idToUse = id || String(Date.now());
  const placeholderHash = bcrypt.hashSync(`firebase:${idToUse}`, 10);
  await query(
    'INSERT INTO users (id, email, name, role, password_hash) VALUES ($1,$2,$3,$4,$5)\n     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role',
    [idToUse, email.toLowerCase(), name || '', role || 'user', placeholderHash]
  );
  const updated = await findUserByEmailAsync(email.toLowerCase());
  return updated as UserRecord;
}
