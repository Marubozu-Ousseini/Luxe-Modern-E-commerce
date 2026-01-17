import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getFirebaseAdmin } from './firebaseAdminInit.js';
import { initFirebaseAdmin } from './firebaseAdminInit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // e.g. .malafaareh.com

export function cookieOptions() {
  // For cross-site requests (frontend on Firebase Hosting or a different subdomain),
  // cookies must use SameSite=None and Secure=true to be included in XHR/fetch.
  const sameSite: 'lax' | 'strict' | 'none' = isProd ? 'none' : 'lax';
  return {
    httpOnly: true,
    sameSite,
    // Browsers will ignore Set-Cookie with Secure over http://localhost.
    // Keep Secure enabled in production where HTTPS is expected.
    secure: isProd,
    domain: COOKIE_DOMAIN,
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getAdminEmails(): Set<string> {
  const emails: string[] = [];

  // Back-compat defaults for this project (can be overridden/extended by env vars)
  emails.push('admin@malafaareh.com');
  emails.push('admin@malafaareh');

  if (process.env.ADMIN_EMAIL) emails.push(process.env.ADMIN_EMAIL);
  if (process.env.ADMIN_EMAILS) {
    emails.push(...process.env.ADMIN_EMAILS.split(',').map((s) => s.trim()).filter(Boolean));
  }
  return new Set(emails.map((e) => e.toLowerCase()));
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Prefer Firebase ID token forwarded by Cloud Functions proxy
    const forwarded = (req.headers['x-firebase-id-token'] || '') as string;
    const forwardedBearer = typeof forwarded === 'string' && forwarded ? forwarded : null;

    // If an Authorization: Bearer <id_token> header is present, try Firebase verification first
    const authHeader = (req.headers.authorization || '') as string;
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const candidateToken = forwardedBearer || bearer;
    if (candidateToken) {
      try {
        initFirebaseAdmin();
        const admin = getFirebaseAdmin();
        if (admin && admin.auth) {
          const decoded: any = await admin.auth().verifyIdToken(candidateToken);
          const email = String(decoded?.email || '').toLowerCase();
          const adminEmails = getAdminEmails();
          const isAdminByEmail = email && adminEmails.has(email);
          const isAdminByClaims = decoded?.admin === true || decoded?.role === 'admin' || decoded?.role === true;
          const role: AuthUser['role'] = isAdminByClaims || isAdminByEmail ? 'admin' : 'user';
          req.user = { id: String(decoded?.uid || ''), email: String(decoded?.email || ''), role } as AuthUser;
          return next();
        }
      } catch {
        // If Firebase verification fails, fall through to cookie-based JWT below
      }
    }

    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Non authentifié' });
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Jeton invalide' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  next();
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}
