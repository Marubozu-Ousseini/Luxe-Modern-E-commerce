import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { fileURLToPath } from 'url';

import productRoutes from './api/produits.js';
import { logger } from './config/logger.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// === Configuration des Middlewares ===
app.use(cors());
app.use(helmet());
app.use(express.json());

// === Routes de l'API ===
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.use('/api/produits', productRoutes);

// === Service des Fichiers Statiques (Frontend React) ===
// Détermine le chemin vers les sources du client et la racine du projet
const srcPath = path.resolve(__dirname, '../../src');
const rootPath = path.resolve(__dirname, '../../');

// Sert les fichiers du dossier 'src' (ex: /components/Header.tsx)
// Permet au navigateur de charger les modules JS/TSX demandés par index.html
app.use(express.static(srcPath));

// Pour toute autre requête GET qui n'est pas une route API, renvoyer l'index.html.
// Cela permet au routeur côté client de React (SPA) de prendre le relais.
app.get('*', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

// === Démarrage du Serveur ===
app.listen(PORT, () => {
  logger.info(`Le serveur est lancé sur le port ${PORT}`);
  logger.info(`Environnement: ${process.env.NODE_ENV}`);
});