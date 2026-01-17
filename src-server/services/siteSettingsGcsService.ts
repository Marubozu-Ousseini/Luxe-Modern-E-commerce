import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

initFirebaseAdmin();

export type SiteSettings = {
  brandName: string;
  tagline: string;
};

type Snapshot = {
  settings: SiteSettings;
  generation: number | null;
};

const DEFAULT_OBJECT_NAME = 'config/site-settings.json';

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.SITE_SETTINGS_BUCKET ||
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

  throw new Error('Site settings bucket not configured');
}

function resolveObjectName(): string {
  return String(process.env.SITE_SETTINGS_OBJECT || DEFAULT_OBJECT_NAME).trim() || DEFAULT_OBJECT_NAME;
}

function getFile() {
  const admin = getFirebaseAdmin();
  const bucketName = resolveBucketName(admin);
  const objectName = resolveObjectName();
  const bucket = admin.storage().bucket(bucketName);
  return { file: bucket.file(objectName), bucketName, objectName };
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'Malafaareh',
  tagline: 'Le luxe qui murmure, la beauté.... Une présence qui reste.',
};

function safeParse(raw: string): SiteSettings {
  try {
    const parsed = JSON.parse(raw) as any;
    const brandName = typeof parsed?.brandName === 'string' ? parsed.brandName.trim() : '';
    const tagline = typeof parsed?.tagline === 'string' ? parsed.tagline.trim() : '';
    return {
      brandName: brandName || DEFAULT_SETTINGS.brandName,
      tagline: tagline || DEFAULT_SETTINGS.tagline,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let cache: { settings: SiteSettings; fetchedAtMs: number; generation: number | null } | null = null;
const CACHE_TTL_MS = 10_000;

async function readSnapshot(opts?: { bypassCache?: boolean }): Promise<Snapshot> {
  const bypassCache = Boolean(opts?.bypassCache);
  if (!bypassCache && cache && Date.now() - cache.fetchedAtMs < CACHE_TTL_MS) {
    return { settings: cache.settings, generation: cache.generation };
  }

  const { file } = getFile();
  try {
    const [buf] = await file.download();
    const settings = safeParse(buf.toString('utf8'));
    const [meta] = await file.getMetadata();
    const gen = meta?.generation ? Number(meta.generation) : null;
    cache = { settings, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
    return { settings: cache.settings, generation: cache.generation };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('No such object') || msg.includes('Not Found') || msg.includes('404')) {
      cache = { settings: { ...DEFAULT_SETTINGS }, fetchedAtMs: Date.now(), generation: null };
      return { settings: cache.settings, generation: null };
    }
    throw e;
  }
}

async function writeSnapshot(settings: SiteSettings, generation: number | null) {
  const { file } = getFile();
  const body = JSON.stringify(settings);
  const preconditionOpts = generation === null ? { ifGenerationMatch: 0 } : { ifGenerationMatch: generation };

  await file.save(body, {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'no-store' },
    preconditionOpts,
  } as any);

  const [meta] = await file.getMetadata();
  const gen = meta?.generation ? Number(meta.generation) : null;
  cache = { settings, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await readSnapshot();
  return snap.settings;
}

export async function setSiteSettings(next: SiteSettings): Promise<void> {
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
  throw new Error('Failed to update site settings due to concurrent updates');
}
