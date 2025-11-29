import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { logger } from '../config/logger.js';
import { initFirebaseAdmin, getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';
import { isDbAvailable } from '../services/db.js';
import { createUser, findUserByEmail, verifyPassword, createUserAsync, findUserByEmailAsync } from '../services/userService.js';
import { signToken, cookieOptions } from '../middleware/auth.js';

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
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ message: 'Champs requis manquants' });
  const user = isDbAvailable() ? await findUserByEmailAsync(email) : findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.cookie('token', token, cookieOptions());
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.post('/logout', (_req, res) => {
  // Must match cookie options used to set in order to clear across domain/path
  res.clearCookie('token', cookieOptions());
  return res.status(204).send();
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

export default router;
