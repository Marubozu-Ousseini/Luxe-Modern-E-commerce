import { Router } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Proxy target (private Cloud Run URL) - set this to your private service URL
const PROXY_TARGET = process.env.PROXY_TARGET || process.env.PRIVATE_SERVICE_URL || '';
if (!PROXY_TARGET) {
  // eslint-disable-next-line no-console
  console.warn('[proxy] PROXY_TARGET not configured; proxy routes will return 503');
}

const auth = new GoogleAuth();

// Only allow authenticated callers (cookie JWT or Firebase ID token bearer)
router.use(requireAuth);

// Basic whitelist: only allow a limited set of paths to be proxied for safety
const ALLOWED_PATHS = [
  '/api/auth/firebase-config',
  '/api/auth/log-google',
  '/api/auth/sync',
  '/api/health',
  '/api/admin/object',
];

function isAllowedPath(path: string) {
  // allow exact matches or prefix matches for object proxy
  if (ALLOWED_PATHS.includes(path)) return true;
  if (path.startsWith('/api/admin/object/')) return true;
  return false;
}

router.all('/*', async (req, res) => {
  if (!PROXY_TARGET) return res.status(503).json({ message: 'Proxy not configured' });

  const forwardPath = req.path; // includes leading /
  if (!isAllowedPath(forwardPath)) return res.status(403).json({ message: 'Path not allowed' });

  try {
    // The GoogleAuth id-token client will attach an Authorization: Bearer <id_token>
    const client = await auth.getIdTokenClient(PROXY_TARGET);
    const targetUrl = `${PROXY_TARGET}${forwardPath}`;

    // Build headers: forward content-type and accept; avoid host header
    const headers: any = {};
    if (req.headers['content-type']) headers['content-type'] = String(req.headers['content-type']);
    if (req.headers['accept']) headers['accept'] = String(req.headers['accept']);
    if (req.headers['authorization']) headers['authorization'] = String(req.headers['authorization']);

    // Use the id-token client to make the request to the private service
    const options: any = {
      url: targetUrl,
      method: req.method,
      headers,
      data: req.body,
      responseType: 'stream',
    };

    const resp: any = await client.request(options);

    // Pipe status, headers and body back to original client
    res.status(resp.status || 200);
    // Copy a subset of headers
    const hopByHop = new Set(['transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade']);
    for (const [k, v] of Object.entries(resp.headers || {})) {
      if (hopByHop.has(k.toLowerCase())) continue;
      if (k.toLowerCase() === 'content-length') continue; // let express handle length
      if (v) res.setHeader(k, v as any);
    }

    // If response is a stream, pipe it
    if (resp.data && typeof resp.data.pipe === 'function') {
      return (resp.data as NodeJS.ReadableStream).pipe(res);
    }

    // Otherwise send JSON/text
    return res.send(resp.data);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[proxy] forward failed', e?.message || e);
    if (e?.response?.status) return res.status(e.response.status).send(e.response.data || { message: 'Upstream error' });
    return res.status(502).json({ message: 'Proxy error' });
  }
});

export default router;
