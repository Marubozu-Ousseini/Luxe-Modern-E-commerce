/*
  Targeted staging auth flow test:
  - Fetch Firebase client config from /api/auth/firebase-config
  - Register a temporary user via Firebase Identity Toolkit REST
  - Call /api/auth/sync with ID token to persist user in DB
  - Call /api/auth/me using returned cookie to verify server session

  Usage:
    STAGING_BASE=https://malafaarehfirebase2025.web.app npx tsx scripts/staging_auth_flow.ts
*/

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

const BASE = process.env.STAGING_BASE || 'https://malafaarehfirebase2025.web.app';

function url(p: string) {
  if (!p.startsWith('/')) p = `/${p}`;
  return `${BASE}${p}`;
}

function randEmail() {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `staging_user_${ts}_${rnd}@example.com`;
}

async function main() {
  console.log(`[staging] Base: ${BASE}`);

  // 1) Fetch Firebase runtime config, fallback to provided constants
  let cfg: FirebaseConfig | null = null;
  try {
    const cfgRes = await fetch(url('/api/auth/firebase-config'));
    if (cfgRes.ok) cfg = (await cfgRes.json()) as FirebaseConfig;
  } catch {}
  if (!cfg) {
    cfg = {
      apiKey: 'AIzaSyA9Y5PPBGrjjCE-dSU7OP2FnZCbeznDel8',
      authDomain: 'malafaareh-481713.firebaseapp.com',
      projectId: 'malafaareh-481713',
      appId: '1:94961718864:web:c7ecb0fba08d99ba802355',
      storageBucket: 'malafaareh-481713.firebasestorage.app',
      messagingSenderId: '94961718864',
      measurementId: undefined as any,
    } as FirebaseConfig;
  }
  console.log('[staging] Firebase config loaded:', { projectId: cfg.projectId, authDomain: cfg.authDomain });

  // 2) Sign up a random user via Identity Toolkit REST API
  const email = randEmail();
  const password = 'Test1234!';
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(cfg.apiKey)}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signUpBody = await signUpRes.json().catch(() => ({}));
  if (!signUpRes.ok) {
    console.error('[staging] signUp error:', signUpBody);
    throw new Error(`Firebase signUp failed: ${signUpRes.status}`);
  }
  const idToken = (signUpBody as any).idToken as string;
  const localId = (signUpBody as any).localId as string;
  if (!idToken || !localId) throw new Error('Missing idToken/localId from signUp');
  console.log('[staging] Firebase signUp ok:', { email, uid: localId });

  // 3) Call /api/auth/sync with ID token to persist user in DB and set cookie
  const syncRes = await fetch(url('/api/auth/sync'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name: 'Staging Test User', idToken }),
  });
  const syncText = await syncRes.text().catch(() => '');
  let syncBody: any = {};
  try { syncBody = JSON.parse(syncText); } catch {}
  const setCookie = syncRes.headers.get('set-cookie');
  if (!syncRes.ok) {
    console.error('[staging] sync error:', syncText || syncBody);
    throw new Error(`User sync failed: ${syncRes.status}`);
  }
  console.log('[staging] Sync ok:', syncBody);
  if (!setCookie) console.warn('[staging] No set-cookie header returned from sync');

  // 4) Call /api/auth/me with cookie to validate session
  const meRes = await fetch(url('/api/auth/me'), {
    headers: setCookie ? { Cookie: setCookie } : undefined,
  });
  const meBody = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    console.error('[staging] /me error:', meBody);
    throw new Error(`/me failed: ${meRes.status}`);
  }
  console.log('[staging] /me:', meBody);

  console.log('\n[staging] Auth flow succeeded.');
}

main().catch((e) => {
  console.error('[staging] FAILED:', e?.message || e);
  process.exitCode = 1;
});
