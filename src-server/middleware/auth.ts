import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getFirebaseAdmin } from './firebaseAdminInit.js';
import { initFirebaseAdmin } from './firebaseAdminInit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // e.g. .malafaareh.com

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as 'lax' | 'strict' | 'none',
    secure: !!isProd,
    domain: COOKIE_DOMAIN,
    // Allow frontend and backend on same apex to share cookies
    // path defaults to '/'
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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // If an Authorization: Bearer <id_token> header is present, try Firebase verification first
    const authHeader = (req.headers.authorization || '') as string;
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (bearer) {
      try {
        initFirebaseAdmin();
        const admin = getFirebaseAdmin();
        if (admin && admin.auth) {
          return admin.auth().verifyIdToken(bearer)
            .then((decoded: any) => {
              // Map Firebase token to our AuthUser shape. We prefer role from custom claims.
              const role = decoded?.admin || decoded?.role ? (decoded.admin ? 'admin' : (decoded.role || 'user')) : 'user';
              req.user = { id: decoded.uid, email: decoded.email || '', role } as AuthUser;
              return next();
            })
            .catch(() => {
              // If Firebase verification fails, fallthrough to cookie-based JWT below
            });
        }
      } catch (e) {
        // ignore firebase errors and fall back to cookie JWT
      }
    }

    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Non authentifié' });
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (e) {
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
