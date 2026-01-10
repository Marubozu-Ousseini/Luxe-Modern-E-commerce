import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserFavoritesById, toggleUserFavoriteById, getUserFavoritesByIdAsync, toggleUserFavoriteByIdAsync } from '../services/userService.js';
import { isDbAvailable } from '../services/db.js';
import { db } from '../db/client.js';
import { userFavorites, products } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/favorites -> list favorites for authenticated user
router.get('/', requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  try {
    if (process.env.USE_FIRESTORE === 'true') {
      const favorites = await getUserFavoritesByIdAsync(req.user.id);
      return res.json({ favorites });
    }
    if (isDbAvailable()) {
      // PostgreSQL implementation
      const favs = await db
        .select({
          id: userFavorites.id,
          productId: userFavorites.productId,
          createdAt: userFavorites.createdAt,
          product: products,
        })
        .from(userFavorites)
        .leftJoin(products, eq(userFavorites.productId, products.id))
        .where(eq(userFavorites.userId, req.user.id));
      
      // Return array of product IDs for backward compatibility
      const favorites = favs.map(f => f.productId);
      return res.json({ favorites, details: favs });
    }
    const favorites = getUserFavoritesById(req.user.id);
    return res.json({ favorites });
  } catch (e) {
    console.error('Error fetching favorites:', e);
    return res.status(500).json({ message: 'Erreur de récupération des favoris' });
  }
});

// POST /api/favorites/toggle { productId }
router.post('/toggle', requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  const { productId } = req.body || {};
  if (typeof productId !== 'number') return res.status(400).json({ message: 'productId invalide' });
  try {
    if (process.env.USE_FIRESTORE === 'true') {
      const favorites = await toggleUserFavoriteByIdAsync(req.user.id, productId);
      return res.json({ favorites });
    }
    if (isDbAvailable()) {
      // PostgreSQL implementation
      const userId = req.user.id;
      
      // Check if already favorited
      const [existing] = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.productId, productId)
        ))
        .limit(1);
      
      if (existing) {
        // Remove from favorites
        await db
          .delete(userFavorites)
          .where(and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.productId, productId)
          ));
      } else {
        // Add to favorites
        await db
          .insert(userFavorites)
          .values({ userId, productId })
          .onConflictDoNothing();
      }
      
      // Return updated favorites list
      const favs = await db
        .select()
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId));
      
      const favorites = favs.map(f => f.productId);
      return res.json({ favorites });
    }
    const favorites = toggleUserFavoriteById(req.user.id, productId);
    return res.json({ favorites });
  } catch (e) {
    console.error('Error toggling favorite:', e);
    return res.status(500).json({ message: 'Erreur de mise à jour des favoris' });
  }
});

export default router;
