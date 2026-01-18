import { Router } from 'express';
import { logger } from '../config/logger.js';
import { getAds } from '../services/adsGcsService.js';

const router = Router();

// Public endpoint: used by storefront to render ads.
router.get('/', async (_req, res) => {
  try {
    const ads = await getAds();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(ads);
  } catch (e: any) {
    logger.error('Erreur lors de la récupération des publicités:', e);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

export default router;
