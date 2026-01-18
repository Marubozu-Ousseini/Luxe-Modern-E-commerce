import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

initFirebaseAdmin();

export type AdKind = 'text' | 'image' | 'video';
export type AdPlacementKey = 'home' | 'shop' | 'category';

export type AdConfig = {
  id: string;
  kind: AdKind;
  placements: AdPlacementKey[];
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  mediaUrl?: string; // /api/media/... for image/video
};

type Snapshot = {
  ads: AdConfig[];
  generation: number | null;
};

const DEFAULT_OBJECT_NAME = 'config/ads.json';

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.ADS_BUCKET ||
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

  throw new Error('Ads bucket not configured');
}

function resolveObjectName(): string {
  return String(process.env.ADS_OBJECT || DEFAULT_OBJECT_NAME).trim() || DEFAULT_OBJECT_NAME;
}

function getFile() {
  const admin = getFirebaseAdmin();
  const bucketName = resolveBucketName(admin);
  const objectName = resolveObjectName();
  const bucket = admin.storage().bucket(bucketName);
  return { file: bucket.file(objectName), bucketName, objectName };
}

function safeParseAds(raw: string): AdConfig[] {
  try {
    const parsed = JSON.parse(raw) as any;
    if (!Array.isArray(parsed)) return [];
    const out: AdConfig[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const id = typeof item.id === 'string' ? item.id : '';
      const kind = item.kind === 'text' || item.kind === 'image' || item.kind === 'video' ? (item.kind as AdKind) : null;
      const placements = Array.isArray(item.placements)
        ? (item.placements.filter((p: any) => p === 'home' || p === 'shop' || p === 'category') as AdPlacementKey[])
        : [];
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const body = typeof item.body === 'string' ? item.body.trim() : '';
      const ctaLabel = typeof item.ctaLabel === 'string' ? item.ctaLabel.trim() : '';
      const href = typeof item.href === 'string' ? item.href.trim() : '';
      const eyebrow = typeof item.eyebrow === 'string' ? item.eyebrow.trim() : undefined;
      const mediaUrl = typeof item.mediaUrl === 'string' ? item.mediaUrl.trim() : undefined;

      if (!id || !kind || placements.length === 0 || !title || !body || !ctaLabel || !href) continue;
      if ((kind === 'image' || kind === 'video') && !mediaUrl) continue;
      out.push({ id, kind, placements, title, body, ctaLabel, href, eyebrow, mediaUrl });
    }
    return out;
  } catch {
    return [];
  }
}

let cache: { ads: AdConfig[]; fetchedAtMs: number; generation: number | null } | null = null;
const CACHE_TTL_MS = 10_000;

async function readSnapshot(opts?: { bypassCache?: boolean }): Promise<Snapshot> {
  const bypassCache = Boolean(opts?.bypassCache);
  if (!bypassCache && cache && Date.now() - cache.fetchedAtMs < CACHE_TTL_MS) {
    return { ads: cache.ads, generation: cache.generation };
  }

  const { file } = getFile();
  try {
    const [buf] = await file.download();
    const ads = safeParseAds(buf.toString('utf8'));
    const [meta] = await file.getMetadata();
    const gen = meta?.generation ? Number(meta.generation) : null;
    cache = { ads, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
    return { ads: cache.ads, generation: cache.generation };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('No such object') || msg.includes('Not Found') || msg.includes('404')) {
      cache = { ads: [], fetchedAtMs: Date.now(), generation: null };
      return { ads: [], generation: null };
    }
    throw e;
  }
}

async function writeSnapshot(ads: AdConfig[], generation: number | null) {
  const { file } = getFile();
  const body = JSON.stringify(ads);
  const preconditionOpts = generation === null ? { ifGenerationMatch: 0 } : { ifGenerationMatch: generation };

  await file.save(body, {
    resumable: false,
    contentType: 'application/json',
    metadata: { cacheControl: 'no-store' },
    preconditionOpts,
  } as any);

  const [meta] = await file.getMetadata();
  const gen = meta?.generation ? Number(meta.generation) : null;
  cache = { ads, fetchedAtMs: Date.now(), generation: Number.isFinite(gen) ? gen : null };
}

export async function getAds(): Promise<AdConfig[]> {
  const snap = await readSnapshot();
  return snap.ads;
}

export async function setAds(next: AdConfig[]): Promise<void> {
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
  throw new Error('Failed to update ads due to concurrent updates');
}
