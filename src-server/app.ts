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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.set('trust proxy', 1);

// Stripe webhook must be set before json() middleware
app.use('/webhooks', stripeWebhookRouter);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(compression());
// Configure Helmet with a CSP that allows the Tailwind CDN and the inline Tailwind config
// The inline Tailwind config is used in index.html (tailwind.config) and needs 'unsafe-inline'
// This is a pragmatic, short-term fix to unblock the deployed site. For production hardening
// we should precompile Tailwind and remove inline scripts or use nonces.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
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
app.use('/api/produits', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/promotions', promotionsRoutes);

// Use the project working directory to locate the built `dist` folder so static
// file serving works correctly whether running source or compiled code.
const rootPath = path.resolve(process.cwd());
const distPath = path.resolve(process.cwd(), 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

export default app;
