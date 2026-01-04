import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { logger } from '../config/logger.js';
import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';
import { isDbAvailable } from '../services/db.js';
import { createUser, findUserByEmail, verifyPassword, createUserAsync, findUserByEmailAsync } from '../services/userService.js';
import { upsertFirebaseUserAsync } from '../services/userUpsert.js';
import { signToken, cookieOptions, requireAuth } from '../middleware/auth.js';

const router = Router();

// Ensure cookies parsed for this router if not globally
router.use(cookieParser());

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, town } = req.body as { name: string; email: string; password: string; phone?: string; town?: string };
    if (!name || !email || !password) return res.status(400).json({ message: 'Champs requis manquants' });
    const user = isDbAvailable()
      ? await createUserAsync(name, email, password, 'user', phone, town)
      : createUser(name, email, password, 'user', phone, town);
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, cookieOptions());
    return res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role, phone: (user as any).phone, town: (user as any).town });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Impossible de créer le compte' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: 'Champs requis manquants' });
    email = String(email).trim();
    const user = isDbAvailable() ? await findUserByEmailAsync(email) : findUserByEmail(email);
    // Debugging: log when user not found or password mismatch in test environment
    if (!user) {
      logger.warn('[auth] login: user not found', { email });
    } else {
      logger.info('[auth] login: found user', { email: user.email, role: user.role, hasPassword: !!user.passwordHash });
    }
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, cookieOptions());
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e: any) {
    logger.error('[auth] login failed', e?.message || e);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

router.post('/logout', (_req, res) => {
  // Must match cookie options used to set in order to clear across domain/path
  res.clearCookie('token', cookieOptions());
  return res.status(204).send();
});

// GET /api/auth/me -> return current user based on cookie or bearer token
router.get('/me', requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  return res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

// Expose minimal Firebase client config for runtime initialization of the frontend.
router.get('/firebase-config', (_req, res) => {
  const cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_CLIENT_API_KEY || "AIzaSyA9Y5PPBGrjjCE-dSU7OP2FnZCbeznDel8",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_CLIENT_AUTH_DOMAIN || "malafaareh-481713.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_PROJECT_ID || "malafaareh-481713",
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_CLIENT_APP_ID || "1:94961718864:web:c7ecb0fba08d99ba802355",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_CLIENT_STORAGE_BUCKET || "malafaareh-481713.firebasestorage.app",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_CLIENT_MESSAGING_SENDER_ID || "94961718864",
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_CLIENT_MEASUREMENT_ID || null,
  } as Record<string, string | null>;
  return res.json(cfg);
});

// Simple endpoint for client to inform server about Google sign-ins (for server-side logging)
router.post('/log-google', async (req, res) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) return res.status(400).json({ message: 'idToken required' });

    // Ensure firebase-admin is initialized (from env or ADC)
    initFirebaseAdmin();
    const admin = getFirebaseAdmin();
    if (!admin || !admin.auth) {
      logger.warn('[auth] Firebase admin not available to verify token');
      return res.status(503).json({ message: 'Firebase admin not available' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || undefined;
      const name = decoded.name || undefined;
      logger.info('[auth] Verified Google sign-in', { uid, email, name });
      return res.status(204).send();
    } catch (e: any) {
      logger.warn('[auth] verifyIdToken failed', e?.message || e);
      return res.status(401).json({ message: 'Invalid ID token' });
    }
  } catch (e: any) {
    logger.warn('[auth] log-google failed', e?.message || e);
    return res.status(500).json({ message: 'Logging failed' });
  }
});

// Upsert the authenticated Firebase user into our DB for consistency.
// Requires Authorization: Bearer <Firebase ID token> or a valid cookie session.
router.post('/sync', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
    const { id, email, role } = req.user;
    const name = (req.body?.name as string) || undefined;

    const persisted = await upsertFirebaseUserAsync(id, email, name, role);
    // Issue a cookie-based JWT to allow cookie auth for subsequent server requests
    const token = signToken({ id: persisted.id, email: persisted.email, role: persisted.role });
    res.cookie('token', token, cookieOptions());
    const { passwordHash, ...safe } = persisted as any;
    return res.status(200).json(safe);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Synchronisation utilisateur échouée' });
  }
});

export default router;
