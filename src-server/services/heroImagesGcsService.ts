import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

initFirebaseAdmin();

export type HeroImagesMap = Record<string, string[]>;

type Snapshot = {
  map: HeroImagesMap;
  generation: number | null;
};

const DEFAULT_OBJECT_NAME = 'config/hero-images.json';

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.HERO_IMAGES_BUCKET ||
      process.env.STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.PRODUCTS_BUCKET ||
      process.env.PRODUCTS_GCS_BUCKET ||
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

  throw new Error('Hero images bucket not configured');
}

function resolveObjectName(): string {
  return String(process.env.HERO_IMAGES_OBJECT || DEFAULT_OBJECT_NAME).trim() || DEFAULT_OBJECT_NAME;
}

function getFile() {
  const admin = getFirebaseAdmin();
  const bucketName = resolveBucketName(admin);
  const objectName = resolveObjectName();
  const bucket = admin.storage().bucket(bucketName);
  return { file: bucket.file(objectName), bucketName, objectName };
}

function safeParseMap(raw: string): HeroImagesMap {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: HeroImagesMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(v)) continue;
      const urls = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      if (urls.length > 0) out[k] = urls;
    }
    return out;
  } catch {
    return {};
  }
}

let cache: { map: HeroImagesMap; fetchedAtMs: number; generation: number | null } | null = null;
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
    return { map, generation: cache.generation };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('No such object') || msg.includes('Not Found') || msg.includes('404')) {
      cache = { map: {}, fetchedAtMs: Date.now(), generation: null };
      return { map: {}, generation: null };
    }
    throw e;
  }
}

async function writeSnapshot(map: HeroImagesMap, generation: number | null) {
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

export async function getHeroImagesMap(): Promise<HeroImagesMap> {
  const snap = await readSnapshot();
  return snap.map;
}

export async function setHeroImagesMap(next: HeroImagesMap): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const snap = await readSnapshot({ bypassCache: true });
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
  throw new Error('Failed to update hero images due to concurrent updates');
}
