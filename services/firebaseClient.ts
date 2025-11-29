import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, getIdToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

export function initFirebaseClient() {
  if (app) return { app, auth };
  if (!firebaseConfig.apiKey) return { app: null, auth: null };
  app = initializeApp(firebaseConfig as any);
  auth = getAuth(app);
  return { app, auth };
}

export async function loginWithEmail(email: string, password: string) {
  initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(email: string, password: string) {
  initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  initFirebaseClient();
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logoutFirebase() {
  if (!auth) return;
  await fbSignOut(auth);
}

export function onAuthChange(cb: (user: any | null) => void) {
  initFirebaseClient();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb as any);
}

export async function getCurrentIdToken(): Promise<string | null> {
  initFirebaseClient();
  if (!auth || !auth.currentUser) return null;
  return getIdToken(auth.currentUser, true);
}
