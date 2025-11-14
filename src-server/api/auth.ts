import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { createUser, findUserByEmail, verifyPassword } from '../services/userService.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

// Ensure cookies parsed for this router if not globally
router.use(cookieParser());

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    if (!name || !email || !password) return res.status(400).json({ message: 'Champs requis manquants' });
    const user = createUser(name, email, password, 'user');
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Impossible de créer le compte' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ message: 'Champs requis manquants' });
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  return res.status(204).send();
});

export default router;
