import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';
import type { Product } from '../../types.js';

initFirebaseAdmin();

const DEFAULT_OBJECT_NAME = 'catalog/products.json';

type Catalog = {
  products: Product[];
};

type CatalogSnapshot = {
  products: Product[];
  generation: number | null;
};

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveProductsBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.PRODUCTS_BUCKET ||
      process.env.PRODUCTS_GCS_BUCKET ||
      process.env.STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      ''
  );
  if (raw) return raw;

  const projectId = String(
    process.env.GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      admin?.app?.()?.options?.projectId ||
      ''
  ).trim();
  if (projectId) return `${projectId}.appspot.com`;

  throw new Error('Products bucket not configured');
}

function resolveCatalogObjectName(): string {
  return String(process.env.PRODUCTS_CATALOG_OBJECT || DEFAULT_OBJECT_NAME).trim() || DEFAULT_OBJECT_NAME;
}

function getFile() {
  const admin = getFirebaseAdmin();
  const bucketName = resolveProductsBucketName(admin);
  const objectName = resolveCatalogObjectName();
  const bucket = admin.storage().bucket(bucketName);
  return { file: bucket.file(objectName), bucketName, objectName };
}

let cache: { products: Product[]; fetchedAtMs: number; generation: number | null } | null = null;
const CACHE_TTL_MS = 15_000;

async function readCatalogSnapshot(opts?: { bypassCache?: boolean }): Promise<CatalogSnapshot> {
  const bypassCache = Boolean(opts?.bypassCache);
  if (!bypassCache && cache && Date.now() - cache.fetchedAtMs < CACHE_TTL_MS) {
    return { products: cache.products, generation: cache.generation };
  }

  const { file } = getFile();

  try {
    const [buf] = await file.download();
    const raw = buf.toString('utf8');
    const parsed = JSON.parse(raw) as Catalog;
    const products = Array.isArray(parsed?.products) ? (parsed.products as Product[]) : [];
    const [meta] = await file.getMetadata();
    const gen = meta?.generation ? Number(meta.generation) : null;
    cache = { products, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
    return { products, generation: cache.generation };
  } catch (e: any) {
    const msg = String(e?.message || e);
    // If the object doesn't exist yet, treat as empty catalog.
    if (msg.includes('No such object') || msg.includes('Not Found') || msg.includes('404')) {
      cache = { products: [], fetchedAtMs: Date.now(), generation: null };
      return { products: [], generation: null };
    }
    throw e;
  }
}

async function writeCatalogSnapshot(products: Product[], generation: number | null) {
  const { file } = getFile();
  const payload: Catalog = { products };
  const body = JSON.stringify(payload);

  const preconditionOpts = generation === null ? { ifGenerationMatch: 0 } : { ifGenerationMatch: generation };

  await file.save(body, {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'no-store' },
    preconditionOpts,
  } as any);

  const [meta] = await file.getMetadata();
  const gen = meta?.generation ? Number(meta.generation) : null;
  cache = { products, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
}

async function updateCatalog(mutator: (products: Product[]) => Product[] | Promise<Product[]>) {
  // Retry on generation precondition failures to avoid lost updates under concurrency.
  for (let attempt = 0; attempt < 4; attempt++) {
    const snap = await readCatalogSnapshot({ bypassCache: true });
    const next = await mutator([...snap.products]);
    try {
      await writeCatalogSnapshot(next, snap.generation);
      return;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const code = e?.code;
      const isPrecondition = code === 412 || msg.includes('Precondition') || msg.includes('conditionNotMet');
      if (isPrecondition) continue;
      throw e;
    }
  }
  throw new Error('Failed to update products catalog due to concurrent updates');
}

export async function seedProductsCatalogIfMissing(seed: Product[]) {
  const snap = await readCatalogSnapshot({ bypassCache: true });
  if (snap.generation !== null) return;

  try {
    await writeCatalogSnapshot(seed, null);
  } catch (e: any) {
    // Another instance may have created it concurrently; ignore precondition failures.
    const msg = String(e?.message || e);
    if (e?.code === 412 || msg.includes('Precondition') || msg.includes('conditionNotMet')) return;
    throw e;
  }
}

export async function getProductsFromCatalog(opts?: { q?: string; limit?: number; offset?: number }): Promise<Product[]> {
  const snap = await readCatalogSnapshot();
  const q = opts?.q ? String(opts.q).toLowerCase() : '';
  let list = snap.products;
  if (q) {
    list = list.filter((p: any) => {
      const name = String(p?.name || '').toLowerCase();
      const desc = String(p?.description || '').toLowerCase();
      const cat = String(p?.category || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }
  const start = Math.max(0, opts?.offset || 0);
  const end = typeof opts?.limit === 'number' ? start + opts.limit : undefined;
  return list.slice(start, end);
}

export async function getAllProductsFromCatalog(): Promise<Product[]> {
  return getProductsFromCatalog();
}

export async function addProductToCatalog(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Promise<Product> {
  let created: Product | null = null;
  await updateCatalog(async (products) => {
    const nextId = Math.max(0, ...products.map((p) => Number((p as any).id) || 0)) + 1;
    created = {
      id: nextId,
      rating: newProduct.rating || { rate: 0, count: 0 },
      stock: (newProduct as any).stock ?? 0,
      ...(newProduct as any),
    } as Product;
    return [...products, created!];
  });
  if (!created) throw new Error('Failed to create product');
  return created;
}

export async function updateProductInCatalog(id: number, updates: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
  let updated: Product | undefined;
  await updateCatalog(async (products) => {
    const idx = products.findIndex((p: any) => Number(p?.id) === id);
    if (idx === -1) return products;
    const next = { ...(products[idx] as any), ...(updates as any) } as Product;
    products[idx] = next;
    updated = next;
    return products;
  });
  return updated;
}

export async function deleteProductFromCatalog(id: number): Promise<boolean> {
  let removed = false;
  await updateCatalog(async (products) => {
    const before = products.length;
    const next = products.filter((p: any) => Number(p?.id) !== id);
    removed = next.length !== before;
    return next;
  });
  return removed;
}
