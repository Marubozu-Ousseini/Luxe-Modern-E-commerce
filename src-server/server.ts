import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'dotenv/config';
import { fileURLToPath } from 'url';

import productRoutes from './api/produits.js';
import authRoutes from './api/auth.js';
import orderRoutes from './api/orders.js';
import adminRoutes from './api/admin.js';
import { logger } from './config/logger.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// === Configuration des Middlewares ===
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

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
app.listen(PORT, () => {
  logger.info(`Le serveur est lancé sur le port ${PORT}`);
  logger.info(`Environnement: ${process.env.NODE_ENV}`);
});