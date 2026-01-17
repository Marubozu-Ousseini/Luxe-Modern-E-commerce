import { Router } from 'express';
import { logger } from '../config/logger.js';
import { getHeroImagesMap } from '../services/heroImagesGcsService.js';

const router = Router();

// Public endpoint: used by storefront to resolve hero images.
router.get('/', async (_req, res) => {
  try {
    const map = await getHeroImagesMap();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(map);
  } catch (e: any) {
    logger.error('Erreur lors de la récupération des hero images:', e);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

export default router;
