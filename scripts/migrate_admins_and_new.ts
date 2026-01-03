#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import os from 'os';
import admin from 'firebase-admin';

function initFirebaseAdminDirect() {
  if ((admin as any).apps && (admin as any).apps.length) return admin;
  const keyJsonEnv = process.env.FIREBASE_ADMIN_KEY;
  try {
    if (keyJsonEnv) {
      const serviceAccount = typeof keyJsonEnv === 'string' ? JSON.parse(keyJsonEnv) : keyJsonEnv;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        projectId: process.env.GCP_PROJECT || (serviceAccount as any).project_id,
      });
      console.info('[migrate-targeted] initialized firebase-admin from FIREBASE_ADMIN_KEY');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      console.info('[migrate-targeted] initialized firebase-admin with default credentials');
    } else {
      throw new Error('No firebase credentials configured; set FIREBASE_ADMIN_KEY or GOOGLE_APPLICATION_CREDENTIALS');
    }
  } catch (e: any) {
    console.error('[migrate-targeted] firebase-admin init failed:', e?.message || e);
    throw e;
  }
  return admin;
}

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(os.tmpdir(), 'luxe-data');
const usersFile = path.join(dataDir, 'users.json');

function readUsersFile(): any[] {
  if (!fs.existsSync(usersFile)) {
    console.error('users.json not found at', usersFile);
    process.exit(1);
  }
  const raw = fs.readFileSync(usersFile, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse users.json:', e);
    process.exit(1);
  }
}

async function createWithRetries(db: FirebaseFirestore.Firestore, docPath: string, payload: any) {
  const max = 4;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      await db.doc(docPath).set(payload);
      return { ok: true };
    } catch (e: any) {
      const code = e?.code || e?.details || e?.message || '';
      if (attempt === max) return { ok: false, error: e };
      // For permission denied, don't retry too long
      if ((code + '').toUpperCase().includes('PERMISSION_DENIED')) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      // transient/backoff
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }
  return { ok: false, error: 'unknown' };
}

async function main() {
  console.log('[migrate-targeted] initializing firebase-admin...');
  const admin = initFirebaseAdminDirect();
  const db = admin.firestore();
  const users = readUsersFile();
  console.log('[migrate-targeted] found', users.length, 'users in', usersFile);

  const toCreate: any[] = [];
  for (const u of users) {
    if (!u?.email) continue;
    // target admin users or any user missing in Firestore
    const docId = u.email.toLowerCase();
    try {
      const snap = await db.collection('users').doc(docId).get();
      if (snap.exists) {
        // already exists — skip unless role is admin and remote role missing
        const remote = snap.data() || {};
        if ((u.role === 'admin') && (remote.role !== 'admin')) {
          toCreate.push(u);
        }
      } else {
        // missing -> create
        toCreate.push(u);
      }
    } catch (e) {
      console.warn('[migrate-targeted] check failed for', docId, (e as any)?.message || e);
      // If check fails due to permissions, still attempt create
      toCreate.push(u);
    }
  }

  console.log('[migrate-targeted] will attempt to create', toCreate.length, 'users (admin & missing)');
  let created = 0;
  for (const u of toCreate) {
    const docId = u.email.toLowerCase();
    const payload = {
      id: u.id || String(Date.now()),
      email: u.email.toLowerCase(),
      name: u.name || '',
      role: u.role || 'user',
      passwordHash: u.passwordHash || null,
      phone: u.phone || null,
      town: u.town || null,
      favorites: u.favorites || [],
      cart: u.cart || [],
      vouchers: u.vouchers || [],
      rewardsPoints: u.rewardsPoints || 0,
      createdAt: new Date().toISOString(),
    };
    const res = await createWithRetries(db, `users/${docId}`, payload);
    if (res.ok) {
      console.log(`[migrate-targeted] created user ${u.email} -> doc ${docId}`);
      created++;
    } else {
      console.error('[migrate-targeted] failed to migrate user', u.email, res.error?.message || res.error);
    }
  }

  console.log('[migrate-targeted] migration complete — created', created, 'users');
  process.exit(0);
}

main().catch(err => {
  console.error('[migrate-targeted] fatal', err);
  process.exit(1);
});
