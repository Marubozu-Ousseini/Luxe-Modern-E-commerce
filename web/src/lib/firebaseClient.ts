import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  GoogleAuthProvider,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  getAuth,
  User,
} from "firebase/auth";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

let cachedConfigPromise: Promise<FirebaseClientConfig> | null = null;
let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

async function fetchFirebaseConfig(): Promise<FirebaseClientConfig> {
  const res = await fetch("/api/auth/firebase-config", {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Unable to load Firebase config (${res.status})`);
  }
  const raw = (await res.json()) as FirebaseClientConfig & { measurementId?: string | null };
  if (!raw?.apiKey || !raw?.authDomain || !raw?.projectId || !raw?.appId) {
    throw new Error("Invalid Firebase config");
  }
  const measurementId = raw.measurementId ?? undefined;
  return { ...raw, measurementId };
}

export async function getFirebaseConfig(): Promise<FirebaseClientConfig> {
  if (!cachedConfigPromise) cachedConfigPromise = fetchFirebaseConfig();
  return cachedConfigPromise;
}

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0]!;
    return cachedApp;
  }
  const config = await getFirebaseConfig();
  cachedApp = initializeApp(config);
  return cachedApp;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (cachedAuth) return cachedAuth;
  const app = await getFirebaseApp();
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  void getFirebaseAuth().then((auth) => {
    unsubscribe = onAuthStateChanged(auth, callback);
  });
  return () => {
    if (unsubscribe) unsubscribe();
  };
}

export async function signInEmailPassword(email: string, password: string): Promise<User> {
  const auth = await getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUpEmailPassword(email: string, password: string, name?: string): Promise<User> {
  const auth = await getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch {
      // ignore profile write errors
    }
  }
  return cred.user;
}

export async function signInGoogle(): Promise<User> {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  const auth = await getFirebaseAuth();
  await signOut(auth);
}

export type SyncUserProfile = {
  name?: string;
  phone?: string;
  town?: string;
};

export async function syncUserToServer(user: User, nameOrProfile?: string | SyncUserProfile): Promise<void> {
  const idToken = await user.getIdToken();
  const profile: SyncUserProfile =
    typeof nameOrProfile === "string" ? { name: nameOrProfile || undefined } : (nameOrProfile || {});
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
      accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(profile),
  });
}

export async function changePasswordWithReauth(currentPassword: string, newPassword: string): Promise<void> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Non authentifié");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function updateDisplayName(name: string): Promise<void> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Non authentifié");
  await updateProfile(user, { displayName: name });
}
