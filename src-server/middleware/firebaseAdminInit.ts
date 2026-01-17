import admin from 'firebase-admin';

let initialized = false;

function resolveFirebaseProjectId(serviceAccountProjectId?: string): string | undefined {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_CLIENT_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    serviceAccountProjectId ||
    undefined
  );
}

export function initFirebaseAdmin() {
  if (initialized) return admin;

  try {
    const keyJson = process.env.FIREBASE_ADMIN_KEY;
    if (keyJson) {
      const serviceAccount = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;
      const projectId = resolveFirebaseProjectId((serviceAccount as any).project_id);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        projectId
      });
      initialized = true;
      // eslint-disable-next-line no-console
      console.info('[firebase-admin] initialized from FIREBASE_ADMIN_KEY');
    } else {
      // Try default credentials (useful for local dev with GOOGLE_APPLICATION_CREDENTIALS set)
      const projectId = resolveFirebaseProjectId();
      // Explicitly set projectId to match Firebase Auth tokens, even if Cloud Run
      // is running in a different GCP project.
      if (projectId) {
        admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });
      } else {
        admin.initializeApp();
      }
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
