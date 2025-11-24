import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserFavoritesById, toggleUserFavoriteById } from '../services/userService.js';
import { isDbAvailable } from '../services/db.js';

const router = express.Router();

// GET /api/favorites -> list favorites for authenticated user
router.get('/', requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  try {
    if (isDbAvailable()) {
      return res.status(501).json({ message: 'Favorites not implemented with DB yet' });
    }
    const favorites = getUserFavoritesById(req.user.id);
    return res.json({ favorites });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur de récupération des favoris' });
  }
});

// POST /api/favorites/toggle { productId }
router.post('/toggle', requireAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  const { productId } = req.body || {};
  if (typeof productId !== 'number') return res.status(400).json({ message: 'productId invalide' });
  try {
    if (isDbAvailable()) {
      return res.status(501).json({ message: 'Favorites not implemented with DB yet' });
    }
    const favorites = toggleUserFavoriteById(req.user.id, productId);
    return res.json({ favorites });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur de mise à jour des favoris' });
  }
});

export default router;
