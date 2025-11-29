import admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return admin;

  try {
    const keyJson = process.env.FIREBASE_ADMIN_KEY;
    if (keyJson) {
      const serviceAccount = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        projectId: process.env.GCP_PROJECT || (serviceAccount as any).project_id
      });
      initialized = true;
      // eslint-disable-next-line no-console
      console.info('[firebase-admin] initialized from FIREBASE_ADMIN_KEY');
    } else {
      // Try default credentials (useful for local dev with GOOGLE_APPLICATION_CREDENTIALS set)
      admin.initializeApp();
      initialized = true;
      // eslint-disable-next-line no-console
      console.info('[firebase-admin] initialized with default credentials');
    }
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn('[firebase-admin] initialization failed:', e?.message || e);
  }

  return admin;
}

export function getFirebaseAdmin() {
  if (!initialized) return initFirebaseAdmin();
  return admin;
}
