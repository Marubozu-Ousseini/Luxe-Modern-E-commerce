import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { logger } from './config/logger.js';

import productRoutes from './api/produits.js';
import authRoutes from './api/auth.js';
import orderRoutes from './api/orders.js';
import adminRoutes from './api/admin.js';
import paymentsRoutes, { stripeWebhookRouter } from './api/payments.js';
import promotionsRoutes from './api/promotions.js';
import cartRoutes from './api/cart.js';
import favoritesRoutes from './api/favorites.js';
import proxyRoutes from './api/proxy.js';
import heroImagesRoutes from './api/hero-images.js';
import mediaRoutes from './api/media.js';
import { isDbAvailable } from './services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

// Stripe webhook must be set before json() middleware
app.use('/webhooks', stripeWebhookRouter);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no origin)
    if (!origin) return callback(null, true);

    // Allow explicit list from ALLOWED_ORIGINS
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Allow common Cloud Run and App Engine hostnames so deployed frontends
    // hosted on run.app or appspot.com are accepted without requiring
    // explicit configuration. Also allow a single FRONTEND_ORIGIN env var
    // if provided (for custom domains).
    const frontendDomain = (process.env.FRONTEND_ORIGIN || '').trim();
    if (frontendDomain && origin === frontendDomain) return callback(null, true);

    if (origin.endsWith('.run.app') || origin.endsWith('.appspot.com')) {
      return callback(null, true);
    }

    // Allow Firebase Hosting preview/custom domains
    if (origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) {
      return callback(null, true);
    }

    // Allow our custom domain (and any subdomains) to access the API once
    // it has been mapped to Cloud Run. This covers requests from
    // https://malafaareh.com and https://www.malafaareh.com without requiring
    // an explicit env var.
    if (origin === 'https://malafaareh.com' || origin.endsWith('.malafaareh.com')) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(compression());
// Configure Helmet with a CSP suitable for compiled Tailwind (no CDN)
// We precompile Tailwind via PostCSS, so no inline Tailwind script is needed.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://firestore.googleapis.com',
        'https://firebasestorage.googleapis.com',
        // Allow Cloud Run upstream if the UI is ever served here
        'https://*.run.app'
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));
app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);

app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => {
  const dbConfigured = Boolean(
    process.env.DATABASE_URL ||
      process.env.PGHOST ||
      (process.env.DB_IAM_AUTH === 'true' && process.env.INSTANCE_CONNECTION_NAME)
  );
  return res.status(200).json({ ok: true, dbConfigured, dbAvailable: isDbAvailable() });
});
app.use('/api/produits', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/hero-images', heroImagesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/proxy', proxyRoutes);

// Static file handler moved to the end, after all API routes
const rootPath = path.resolve(process.cwd());
const distPath = path.resolve(process.cwd(), 'dist/client');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

export default app;
