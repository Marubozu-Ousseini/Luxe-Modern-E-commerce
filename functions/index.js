import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import admin from 'firebase-admin';
import { GoogleAuth } from 'google-auth-library';

if (!admin.apps.length) {
  admin.initializeApp();
}

const PROXY_TARGET = process.env.PROXY_TARGET || 'https://luxe-modern-ecommerce-api-dxt5icpcca-ew.a.run.app';
const PUBLIC_PATHS = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', pathPrefix: '/api/produits' },
  { method: 'GET', pathPrefix: '/api/promotions' },
  { method: 'GET', path: '/api/auth/firebase-config' },
  // Auth endpoints should be publicly accessible
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' }
];

function isPublic(reqPath, method) {
  return PUBLIC_PATHS.some(rule => {
    if (rule.method && rule.method !== method) return false;
    if (rule.path && rule.path === reqPath) return true;
    if (rule.pathPrefix && (reqPath === rule.pathPrefix || reqPath.startsWith(rule.pathPrefix + '/'))) return true;
    return false;
  });
}

async function verifyFirebaseCaller(req) {
  const header = req.headers['authorization'] || '';
  const bearer = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
  let idToken = bearer;
  if (!idToken && req.cookies && req.cookies.token) idToken = req.cookies.token;
  if (!idToken) throw Object.assign(new Error('Missing ID token'), { status: 401 });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch (e) {
    throw Object.assign(new Error('Invalid ID token'), { status: 401 });
  }
}

const auth = new GoogleAuth();

export const apiProxy = onRequest({ region: 'us-central1', cors: false, maxInstances: 10 }, async (req, res) => {
  try {
    const path = req.path || req.originalUrl || '/';

    // Serve firebase-config directly from Functions to avoid upstream 403s
    if (req.method === 'GET' && path === '/api/auth/firebase-config') {
      const cfg = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_CLIENT_API_KEY || "AIzaSyA9Y5PPBGrjjCE-dSU7OP2FnZCbeznDel8",
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_CLIENT_AUTH_DOMAIN || "malafaareh-481713.firebaseapp.com",
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_PROJECT_ID || "malafaareh-481713",
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_CLIENT_APP_ID || "1:94961718864:web:c7ecb0fba08d99ba802355",
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_CLIENT_STORAGE_BUCKET || "malafaareh-481713.firebasestorage.app",
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_CLIENT_MESSAGING_SENDER_ID || "94961718864",
        measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_CLIENT_MEASUREMENT_ID || null,
      };
      return res.json(cfg);
    }

    // Auth sync: prefer forwarding to backend unless Firestore is explicitly enabled
    if (req.method === 'POST' && path === '/api/auth/sync') {
      try {
        const header = req.headers['authorization'] || '';
        let token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token) {
          try {
            const body = req.body || (req.rawBody ? JSON.parse(Buffer.from(req.rawBody).toString('utf8')) : {});
            token = body?.idToken || null;
          } catch {}
        }
        if (!token) return res.status(401).json({ message: 'Missing ID token' });

        // If Firestore path explicitly enabled, upsert minimal user there (optional)
        if (process.env.FIRESTORE_ENABLED === 'true') {
          const decoded = await admin.auth().verifyIdToken(token);
          const uid = decoded.uid;
          const email = (decoded.email || '').toLowerCase();
          const body = req.body || {};
          const name = (body && body.name) || decoded.name || '';
          const role = decoded.admin ? 'admin' : (decoded.role || 'user');

          const db = admin.firestore();
          const docRef = db.collection('users').doc(email || uid);
          await docRef.set({ id: uid, email, name, role }, { merge: true });

          // Set a non-auth cookie purely to satisfy clients expecting a cookie; actual auth uses Firebase
          res.setHeader('Set-Cookie', 'token=firebase; Path=/; SameSite=None; Secure');
          return res.status(200).json({ id: uid, email, name, role });
        }

        // Otherwise forward to backend /api/auth/sync with Google-signed Run token and original Firebase ID token
        const targetUrl = `${PROXY_TARGET}${path}`;
        const client = await auth.getIdTokenClient(PROXY_TARGET);
        const tokenHeaders = await client.getRequestHeaders();
        const headers = {
          'content-type': req.headers['content-type'] || 'application/json',
          accept: req.headers['accept'] || '*/*',
          ...tokenHeaders
        };
        if (token) headers['x-firebase-id-token'] = token;
        const init = {
          method: 'POST',
          headers,
          body: req.rawBody ? req.rawBody : JSON.stringify(req.body || {})
        };
        const upstream = await fetch(targetUrl, init);
        res.status(upstream.status);
        upstream.headers.forEach((v, k) => {
          if (k.toLowerCase() === 'content-length') return;
          res.setHeader(k, v);
        });
        const buf = Buffer.from(await upstream.arrayBuffer());
        return res.send(buf);
      } catch (e) {
        logger.error('sync forward failed', e);
        return res.status(401).json({ message: e?.message || 'Unauthorized' });
      }
    }

    // Auth me: verify Firebase ID token and return user info directly
    if (req.method === 'GET' && path === '/api/auth/me') {
      try {
        const header = req.headers['authorization'] || '';
        const bearer = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
        const forwarded = req.headers['x-firebase-id-token'] || '';
        const token = bearer || (typeof forwarded === 'string' ? forwarded : null);
        if (!token) return res.status(401).json({ message: 'Non authentifié' });
        const decoded = await admin.auth().verifyIdToken(token);
        const role = decoded.admin ? 'admin' : (decoded.role || 'user');
        return res.json({ id: decoded.uid, email: decoded.email || '', role });
      } catch (e) {
        logger.error('me verify failed', e);
        return res.status(401).json({ message: e?.message || 'Jeton invalide' });
      }
    }

    // Optional auth: public for safe GETs; require auth otherwise
    if (!isPublic(path, req.method)) {
      try {
        await verifyFirebaseCaller(req);
      } catch (err) {
        const status = err.status || 401;
        return res.status(status).json({ message: err.message || 'Unauthorized' });
      }
    }

    const targetUrl = `${PROXY_TARGET}${path}`;

    // Acquire Google-signed ID token for Cloud Run target
    const client = await auth.getIdTokenClient(PROXY_TARGET);
    const tokenHeaders = await client.getRequestHeaders();

    // Preserve original Firebase ID token from the caller, so backend can authenticate the user
    const originalAuthHeader = req.headers['authorization'];
    const firebaseIdToken = (typeof originalAuthHeader === 'string' && originalAuthHeader.startsWith('Bearer '))
      ? originalAuthHeader.slice(7)
      : null;

    const headers = {
      'content-type': req.headers['content-type'] || 'application/json',
      accept: req.headers['accept'] || '*/*',
      ...tokenHeaders
    };
    if (firebaseIdToken) headers['x-firebase-id-token'] = firebaseIdToken;

    const init = {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : (req.rawBody ? req.rawBody : JSON.stringify(req.body || {}))
    };

    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-length') return;
      res.setHeader(k, v);
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (e) {
    logger.error('proxy error', e);
    return res.status(502).json({ message: 'Upstream error' });
  }
});
