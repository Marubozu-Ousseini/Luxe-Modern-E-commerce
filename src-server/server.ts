import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'dotenv/config';
import { fileURLToPath } from 'url';

import productRoutes from './api/produits.js';
import authRoutes from './api/auth.js';
import orderRoutes from './api/orders.js';
import adminRoutes from './api/admin.js';
import { initDb, isDbAvailable } from './services/db.js';
import { createUserAsync, findUserByEmailAsync } from './services/userService.js';
import { logger } from './config/logger.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const isProd = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://www.malafaareh.com,https://malafaareh.com')
  .split(',')
  .map(s => s.trim());

// === Configuration des Middlewares ===
app.set('trust proxy', 1); // required when behind reverse proxy to set secure cookies
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
// Apply gzip compression
app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Basic global rate limit to protect API
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);

// === Routes de l'API ===
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.use('/api/produits', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// === Service des Fichiers Statiques (Frontend React) ===
// En développement, utiliser Vite (npm run dev:client). En production, servir le build.
const rootPath = path.resolve(__dirname, '../../');
const distPath = path.resolve(__dirname, '../../dist');

if (process.env.NODE_ENV === 'production') {
  // Sert les assets construits par Vite
  app.use(express.static(distPath));
  // Pour toute route non API, renvoyer le index.html du build
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// === Démarrage du Serveur ===
async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@malafaareh.com';
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed');
      return;
    }
    if (isDbAvailable()) {
      const existing = await findUserByEmailAsync(email);
      if (!existing) {
        await createUserAsync('Administrator', email, password, 'admin');
        logger.info(`(DB) Admin user created for ${email}`);
      } else if (existing.role !== 'admin') {
        logger.warn(`(DB) User ${email} exists but is not admin. Update role manually.`);
      } else {
        logger.info('(DB) Admin user already present');
      }
    } else {
      const { findUserByEmail, createUser } = await import('./services/userService.js');
      const existing = findUserByEmail(email);
      if (!existing) {
        createUser('Administrator', email, password, 'admin');
        logger.info(`(FS) Admin user created for ${email}`);
      } else if (existing.role !== 'admin') {
        logger.warn(`(FS) User ${email} exists but is not admin. Delete user in data/users.json to recreate as admin.`);
      } else {
        logger.info('(FS) Admin user already present');
      }
    }
  } catch (e) {
    logger.error('Admin seed failed', e);
  }
}

app.listen(PORT, async () => {
  logger.info(`Le serveur est lancé sur le port ${PORT}`);
  logger.info(`Environnement: ${process.env.NODE_ENV}`);
  await initDb();
  await seedAdmin();
});