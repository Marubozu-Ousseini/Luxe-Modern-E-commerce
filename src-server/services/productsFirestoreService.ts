import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';
import type { Product } from '../../types.js';

initFirebaseAdmin();
const admin = getFirebaseAdmin();
const db = admin.firestore();

const PRODUCTS_COL = 'products';
const META_COL = 'meta';
const COUNTER_DOC = 'productCounter';

type FirestoreProduct = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  description: string;
  category: string;
  imageUrl: string;
  stock?: number | null;
  limitedAvailability?: boolean | null;
  rating?: { rate: number; count: number };
  labels?: string[] | null;
  createdAt?: any;
  updatedAt?: any;
};

function productDocRefById(id: number) {
  return db.collection(PRODUCTS_COL).doc(String(id));
}

function normalizeProduct(data: any): Product | null {
  if (!data) return null;
  const id = Number(data.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(data.name || ''),
    price: Number(data.price || 0),
    originalPrice: data.originalPrice ?? undefined,
    description: String(data.description || ''),
    category: String(data.category || ''),
    imageUrl: String(data.imageUrl || ''),
    stock: typeof data.stock === 'number' ? data.stock : 0,
    limitedAvailability: Boolean(data.limitedAvailability) || undefined,
    rating: {
      rate: Number(data.rating?.rate || 0),
      count: Number(data.rating?.count || 0),
    },
    labels: Array.isArray(data.labels) ? data.labels : undefined,
  } as any;
}

export async function getAllProductsFs(): Promise<Product[]> {
  const snap = await db.collection(PRODUCTS_COL).orderBy('id', 'asc').get();
  return snap.docs
    .map((d) => normalizeProduct(d.data()))
    .filter(Boolean) as Product[];
}

export async function getProductsFs(opts?: { q?: string; limit?: number; offset?: number }): Promise<Product[]> {
  const q = opts?.q ? String(opts.q).toLowerCase() : '';
  const all = await getAllProductsFs();
  let list = all;
  if (q) {
    list = list.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      const desc = String((p as any).description || '').toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }
  const start = Math.max(0, opts?.offset || 0);
  const end = typeof opts?.limit === 'number' ? start + opts.limit : undefined;
  return list.slice(start, end);
}

export async function addProductFs(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Promise<Product> {
  const counterRef = db.collection(META_COL).doc(COUNTER_DOC);

  const created = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const nextIdRaw = snap.exists ? (snap.data() as any)?.nextId : undefined;
    const nextId = Number.isFinite(Number(nextIdRaw)) ? Number(nextIdRaw) : 1000;

    const id = nextId;
    tx.set(counterRef, { nextId: id + 1 }, { merge: true });

    const payload: FirestoreProduct = {
      id,
      name: newProduct.name,
      price: newProduct.price,
      originalPrice: (newProduct as any).originalPrice ?? null,
      description: (newProduct as any).description,
      category: (newProduct as any).category,
      imageUrl: (newProduct as any).imageUrl,
      stock: (newProduct as any).stock ?? 0,
      limitedAvailability: (newProduct as any).limitedAvailability ?? false,
      rating: newProduct.rating || { rate: 0, count: 0 },
      labels: (newProduct as any).labels ?? [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    tx.set(productDocRefById(id), payload, { merge: true });
    return payload;
  });

  return (normalizeProduct(created) || {
    id: created.id,
    rating: created.rating || { rate: 0, count: 0 },
    ...(created as any),
  }) as Product;
}

export async function updateProductFs(id: number, updates: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
  const docRef = productDocRefById(id);
  const snap = await docRef.get();
  if (!snap.exists) return undefined;

  const payload: Partial<FirestoreProduct> = {
    name: updates.name,
    price: updates.price,
    originalPrice: (updates as any).originalPrice,
    description: (updates as any).description,
    category: (updates as any).category,
    imageUrl: (updates as any).imageUrl,
    stock: (updates as any).stock,
    limitedAvailability: (updates as any).limitedAvailability,
    labels: (updates as any).labels,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Remove undefined fields so Firestore doesn't reject update()
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) delete (payload as any)[k];
  }

  await docRef.set(payload, { merge: true });
  const updated = await docRef.get();
  return normalizeProduct(updated.data()) || undefined;
}

export async function deleteProductFs(id: number): Promise<boolean> {
  const docRef = productDocRefById(id);
  const snap = await docRef.get();
  if (!snap.exists) return false;
  await docRef.delete();
  return true;
}
