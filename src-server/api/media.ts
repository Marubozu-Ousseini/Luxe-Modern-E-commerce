import { Router } from 'express';
import { getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';

const router = Router();

function normalizeBucketName(raw: string): string {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.endsWith('.firebasestorage.app')) return v.replace(/\.firebasestorage\.app$/, '.appspot.com');
  if (v.endsWith('.firebaseapp.com')) return v.replace(/\.firebaseapp\.com$/, '.appspot.com');
  return v;
}

function resolveStorageBucketName(admin: any): string {
  const raw = normalizeBucketName(
    process.env.STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.PRODUCTS_BUCKET ||
      process.env.PRODUCTS_GCS_BUCKET ||
      ''
  );
  if (raw) return raw;

  const projectId =
    String(
      process.env.GCP_PROJECT ||
        process.env.GCLOUD_PROJECT ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        admin?.app?.()?.options?.projectId ||
        ''
    ).trim();
  if (projectId) return `${projectId}.appspot.com`;

  throw new Error('STORAGE_BUCKET not configured and projectId unavailable');
}

function isAllowedObjectName(objectName: string) {
  if (!objectName) return false;
  if (objectName.includes('..')) return false;
  // Only allow images uploaded via admin upload flow.
  if (objectName.startsWith('admin_uploads/')) return true;
  return false;
}

// Public proxy to stream an uploaded object from the private bucket.
// Object names may contain slashes (e.g. admin_uploads/...).
// Some proxies/frameworks decode %2F before routing, which breaks "/:param" routes.
// Use a wildcard route so both encoded and decoded slashes work.
router.get('/*', async (req, res) => {
  try {
    const rawTail = String((req.params as any)?.[0] || '');
    let objectName = rawTail;
    try {
      objectName = decodeURIComponent(rawTail);
    } catch {
      objectName = rawTail;
    }
    if (!isAllowedObjectName(objectName)) return res.status(404).json({ message: 'Objet introuvable' });

    const admin = getFirebaseAdmin();
    const bucketName = resolveStorageBucketName(admin);
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(objectName);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ message: 'Objet introuvable' });

    const [meta] = await file.getMetadata();
    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', meta.cacheControl || 'public, max-age=31536000, s-maxage=31536000');

    const size = meta.size ? Number(meta.size) : NaN;
    res.setHeader('Accept-Ranges', 'bytes');

    const range = String(req.headers.range || '');
    const hasValidSize = Number.isFinite(size) && size > 0;
    if (range && hasValidSize) {
      const m = range.match(/bytes=(\d+)-(\d*)/);
      if (m) {
        const start = Number(m[1]);
        const endRaw = m[2] ? Number(m[2]) : NaN;
        const end = Number.isFinite(endRaw) ? Math.min(endRaw, size - 1) : size - 1;
        if (Number.isFinite(start) && start >= 0 && end >= start && end < size) {
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
          res.setHeader('Content-Length', String(end - start + 1));
          const stream = file.createReadStream({ start, end });
          stream.on('error', (_err) => {
            if (!res.headersSent) res.status(500).end('Stream error');
          });
          return stream.pipe(res);
        }
      }
    }

    const stream = file.createReadStream();
    stream.on('error', (_err) => {
      if (!res.headersSent) res.status(500).end('Stream error');
    });
    return stream.pipe(res);
  } catch (e: any) {
    return res.status(500).json({ message: 'Erreur serveur', details: String(e?.message || e) });
  }
});

export default router;
