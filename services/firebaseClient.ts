import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdToken } from 'firebase/auth';

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

async function fetchClientConfig() {
  try {
    const resp = await fetch('/api/auth/firebase-config');
    if (!resp.ok) return null;
    const json = await resp.json();
    return json;
  } catch {
    return null;
  }
}

export async function initFirebaseClient() {
  if (app) return { app, auth };
  // Prefer build-time Vite vars when available (import.meta.env), otherwise fetch runtime config
  const buildApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
  let cfg: any = null;
  if (buildApiKey) {
    cfg = {
      apiKey: buildApiKey,
      authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
      appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
      storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID,
    };
  } else {
    cfg = await fetchClientConfig();
  }
  if (!cfg || !cfg.apiKey) {
    return { app: null, auth: null };
  }
  app = initializeApp(cfg as any);
  auth = getAuth(app);
  return { app, auth };
}

export async function loginWithEmail(email: string, password: string) {
  await initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(email: string, password: string) {
  await initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  await initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logoutFirebase() {
  await initFirebaseClient();
  if (!auth) return;
  await fbSignOut(auth);
}

export async function onAuthChange(cb: (user: any | null) => void) {
  await initFirebaseClient();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb as any);
}

export async function getCurrentIdToken(): Promise<string | null> {
  await initFirebaseClient();
  if (!auth || !auth.currentUser) return null;
  return getIdToken(auth.currentUser, true);
}
