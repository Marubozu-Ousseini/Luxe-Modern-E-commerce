#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import os from 'os';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize firebase-admin directly to avoid importing server modules.
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
      console.info('[migrate] initialized firebase-admin from FIREBASE_ADMIN_KEY');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Let firebase-admin pick up the default credentials from env path
      admin.initializeApp();
      console.info('[migrate] initialized firebase-admin with default credentials');
    } else {
      throw new Error('No firebase credentials configured; set FIREBASE_ADMIN_KEY or GOOGLE_APPLICATION_CREDENTIALS');
    }
  } catch (e: any) {
    console.error('[migrate] firebase-admin init failed:', e?.message || e);
    throw e;
  }
  return admin;
}

// Determine dataDir like the server does
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

async function main() {
  console.log('[migrate] initializing firebase-admin...');
  const admin = initFirebaseAdminDirect();
  const db = admin.firestore();
  const users = readUsersFile();
  console.log('[migrate] found', users.length, 'users in', usersFile);

  for (const u of users) {
    try {
      if (!u.email) {
        console.warn('[migrate] skipping user with no email:', u);
        continue;
      }
      const docId = u.email.toLowerCase();
      const ref = db.collection('users').doc(docId);
      const snap = await ref.get();
      if (snap.exists) {
        console.log(`[migrate] user ${u.email} already exists in Firestore, skipping`);
        continue;
      }
      // Ensure payload includes id and lowercased email
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
      } as any;
      await ref.set(payload);
      console.log(`[migrate] created user ${u.email} -> doc ${docId}`);
    } catch (e: any) {
      console.error('[migrate] failed to migrate user', u?.email, e?.message || e);
    }
  }

  console.log('[migrate] migration complete');
  process.exit(0);
}

// Call main() directly. This file may be executed under ESM tooling (tsx) where
// `require.main` is not available; calling main() unconditionally is acceptable
// because the script is intended to be run as a CLI tool.
main().catch(err => {
  console.error('[migrate] fatal', err);
  process.exit(1);
});
