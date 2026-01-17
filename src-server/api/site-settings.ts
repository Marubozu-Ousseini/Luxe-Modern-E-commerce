import { Router } from 'express';
import { logger } from '../config/logger.js';
import { getSiteSettings } from '../services/siteSettingsGcsService.js';

const router = Router();

// Public endpoint: used by storefront for brand name/tagline.
router.get('/', async (_req, res) => {
  try {
    const settings = await getSiteSettings();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(settings);
  } catch (e: any) {
    logger.error('Erreur lors de la récupération des site settings:', e);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

export default router;
