import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

initFirebaseAdmin();

export type ProductExtras = {
  images?: string[];
  colors?: string[];
  sizes?: string[];
  editorNote?: string;
};

export type ProductExtrasMap = Record<string, ProductExtras>;

type Snapshot = {
  map: ProductExtrasMap;
  generation: number | null;
};

const DEFAULT_OBJECT_NAME = 'config/product-extras.json';

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.PRODUCT_EXTRAS_BUCKET ||
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

  throw new Error('Product extras bucket not configured');
}

function resolveObjectName(): string {
  return String(process.env.PRODUCT_EXTRAS_OBJECT || DEFAULT_OBJECT_NAME).trim() || DEFAULT_OBJECT_NAME;
}

function getFile() {
  const admin = getFirebaseAdmin();
  const bucketName = resolveBucketName(admin);
  const objectName = resolveObjectName();
  const bucket = admin.storage().bucket(bucketName);
  return { file: bucket.file(objectName), bucketName, objectName };
}

function normalizeStringArray(input: unknown, maxItems: number): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const v of input) {
    if (typeof v !== 'string') continue;
    const s = v.trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function safeParseMap(raw: string): ProductExtrasMap {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const out: ProductExtrasMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const images = normalizeStringArray((v as any).images, 12);
      const colors = normalizeStringArray((v as any).colors, 20);
      const sizes = normalizeStringArray((v as any).sizes, 30);
      const editorNoteRaw = typeof (v as any).editorNote === 'string' ? String((v as any).editorNote).trim() : '';
      const editorNote = editorNoteRaw ? editorNoteRaw.slice(0, 400) : undefined;

      const extras: ProductExtras = {};
      if (images.length) extras.images = images;
      if (colors.length) extras.colors = colors;
      if (sizes.length) extras.sizes = sizes;
      if (editorNote) extras.editorNote = editorNote;

      if (Object.keys(extras).length) out[String(k)] = extras;
    }
    return out;
  } catch {
    return {};
  }
}

let cache: { map: ProductExtrasMap; fetchedAtMs: number; generation: number | null } | null = null;
const CACHE_TTL_MS = 10_000;

async function readSnapshot(opts?: { bypassCache?: boolean }): Promise<Snapshot> {
  const bypassCache = Boolean(opts?.bypassCache);
  if (!bypassCache && cache && Date.now() - cache.fetchedAtMs < CACHE_TTL_MS) {
    return { map: cache.map, generation: cache.generation };
  }

  const { file } = getFile();
  try {
    const [buf] = await file.download();
    const map = safeParseMap(buf.toString('utf8'));
    const [meta] = await file.getMetadata();
    const gen = meta?.generation ? Number(meta.generation) : null;
    cache = { map, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
    return { map: cache.map, generation: cache.generation };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('No such object') || msg.includes('Not Found') || msg.includes('404')) {
      cache = { map: {}, fetchedAtMs: Date.now(), generation: null };
      return { map: {}, generation: null };
    }
    throw e;
  }
}

async function writeSnapshot(map: ProductExtrasMap, generation: number | null) {
  const { file } = getFile();
  const body = JSON.stringify(map);
  const preconditionOpts = generation === null ? { ifGenerationMatch: 0 } : { ifGenerationMatch: generation };

  await file.save(body, {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'no-store' },
    preconditionOpts,
  } as any);

  const [meta] = await file.getMetadata();
  const gen = meta?.generation ? Number(meta.generation) : null;
  cache = { map, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
}

export async function getProductExtrasMap(): Promise<ProductExtrasMap> {
  const snap = await readSnapshot();
  return snap.map;
}

export async function setProductExtras(productId: number, patch: { images?: string[]; colors?: string[]; sizes?: string[]; editorNote?: string | null }): Promise<void> {
  const key = String(productId);

  for (let attempt = 0; attempt < 4; attempt++) {
    const snap = await readSnapshot({ bypassCache: true });
    const next: ProductExtrasMap = { ...(snap.map || {}) };
    const current = next[key] || {};

    const updated: ProductExtras = { ...current };

    if (patch.images !== undefined) {
      const images = normalizeStringArray(patch.images, 12);
      if (images.length) updated.images = images;
      else delete (updated as any).images;
    }

    if (patch.colors !== undefined) {
      const colors = normalizeStringArray(patch.colors, 20);
      if (colors.length) updated.colors = colors;
      else delete (updated as any).colors;
    }

    if (patch.sizes !== undefined) {
      const sizes = normalizeStringArray(patch.sizes, 30);
      if (sizes.length) updated.sizes = sizes;
      else delete (updated as any).sizes;
    }

    if (patch.editorNote !== undefined) {
      const note = typeof patch.editorNote === 'string' ? patch.editorNote.trim() : '';
      if (note) updated.editorNote = note.slice(0, 400);
      else delete (updated as any).editorNote;
    }

    if (Object.keys(updated).length) next[key] = updated;
    else delete next[key];

    try {
      await writeSnapshot(next, snap.generation);
      return;
    } catch (e: any) {
      const msg = String(e?.message || e);
      const code = e?.code;
      const isPrecondition = code === 412 || msg.includes('Precondition') || msg.includes('conditionNotMet');
      if (isPrecondition) continue;
      throw e;
    }
  }

  throw new Error('Failed to update product extras due to concurrent updates');
}
