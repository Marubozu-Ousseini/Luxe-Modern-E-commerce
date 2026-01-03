import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

initFirebaseAdmin();
const admin = getFirebaseAdmin();
const db = admin.firestore();

export interface FirestoreUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  passwordHash?: string;
  phone?: string;
  town?: string;
  favorites?: number[];
  cart?: any[];
  vouchers?: any[];
  rewardsPoints?: number;
}

function userDocRefByEmail(email: string) {
  const key = email.toLowerCase();
  return db.collection('users').doc(key);
}

function userDocRefById(id: string) {
  return db.collection('users').doc(id);
}

export async function findUserByEmailFs(email: string): Promise<FirestoreUser | null> {
  const snap = await userDocRefByEmail(email).get();
  if (!snap.exists) return null;
  return snap.data() as FirestoreUser;
}

export async function findUserByIdFs(id: string): Promise<FirestoreUser | null> {
  const snap = await userDocRefById(id).get();
  if (!snap.exists) return null;
  return snap.data() as FirestoreUser;
}

export async function createUserFs(user: FirestoreUser): Promise<FirestoreUser> {
  // Use email lowercased as doc id to allow find by email
  const doc = userDocRefByEmail(user.email);
  const id = user.id || String(Date.now());
  const payload = { ...user, id, email: user.email.toLowerCase() };
  await doc.set(payload, { merge: true });
  return payload as FirestoreUser;
}

export async function createUserIfNotExistsFs(user: FirestoreUser): Promise<FirestoreUser> {
  const existing = await findUserByEmailFs(user.email);
  if (existing) return existing;
  return createUserFs(user);
}

export async function setUserPasswordFs(email: string, passwordHash: string): Promise<FirestoreUser | null> {
  const doc = userDocRefByEmail(email);
  const snap = await doc.get();
  if (!snap.exists) return null;
  await doc.update({ passwordHash });
  const updated = await doc.get();
  return updated.data() as FirestoreUser;
}

export async function setUserRoleFs(email: string, role: string): Promise<FirestoreUser | null> {
  const doc = userDocRefByEmail(email);
  const snap = await doc.get();
  if (!snap.exists) return null;
  await doc.update({ role });
  const updated = await doc.get();
  return updated.data() as FirestoreUser;
}

export async function getAllUsersSanitizedFs(): Promise<any[]> {
  const col = await db.collection('users').get();
  return col.docs.map(d => {
    const data = d.data();
    // remove passwordHash
    const { passwordHash, ...rest } = data as any;
    return rest;
  });
}

export async function getUserFavoritesByIdFs(id: string): Promise<number[]> {
  const snap = await userDocRefById(id).get();
  if (!snap.exists) return [];
  const data = snap.data() as any;
  return data.favorites || [];
}

export async function toggleUserFavoriteByIdFs(id: string, productId: number): Promise<number[]> {
  const docRef = userDocRefById(id);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Utilisateur introuvable');
  const data = snap.data() as any;
  const favs: number[] = data.favorites || [];
  const updated = favs.includes(productId) ? favs.filter(f => f !== productId) : [...favs, productId];
  await docRef.update({ favorites: updated });
  return updated;
}

export async function getCartByUserIdFs(id: string): Promise<any[]> {
  const snap = await userDocRefById(id).get();
  if (!snap.exists) return [];
  const data = snap.data() as any;
  return data.cart || [];
}

export async function setCartByUserIdFs(id: string, cart: any[]): Promise<void> {
  const docRef = userDocRefById(id);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Utilisateur introuvable');
  await docRef.update({ cart });
}

export default {
  findUserByEmailFs,
  findUserByIdFs,
  createUserFs,
  createUserIfNotExistsFs,
  setUserPasswordFs,
  setUserRoleFs,
  getAllUsersSanitizedFs,
  getUserFavoritesByIdFs,
  toggleUserFavoriteByIdFs,
  getCartByUserIdFs,
  setCartByUserIdFs,
};
