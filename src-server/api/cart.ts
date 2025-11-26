import { Router } from 'express';
import { logger } from '../config/logger.js';
import * as userService from '../services/userService.js';

const router = Router();

function mergeCarts(serverCart: any[] = [], clientCart: any[] = []): any[] {
  const map = new Map();
  for (const item of serverCart) map.set(String(item.productId), { ...item });
  for (const item of clientCart) {
    const key = String(item.productId);
    const existing = map.get(key);
    if (existing) {
      existing.qty = (existing.qty || 0) + (item.qty || 0);
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

// GET /api/cart - returns server cart for authenticated user or []
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.json([]);
    const cart = await userService.getCartByUserId(user.id);
    return res.json(cart || []);
  } catch (e) {
    logger.error('GET /api/cart error', e);
    return res.status(500).json({ message: 'Failed to get cart' });
  }
});

// POST /api/cart/merge - merges client cart into server cart for authenticated user
router.post('/merge', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(401).json({ message: 'Not authenticated' });
    const clientCart = Array.isArray(req.body.cart) ? req.body.cart : [];
    const serverCart = await userService.getCartByUserId(user.id) || [];
    const merged = mergeCarts(serverCart, clientCart);
    await userService.setCartByUserId(user.id, merged);
    return res.json(merged);
  } catch (e) {
    logger.error('POST /api/cart/merge error', e);
    return res.status(500).json({ message: 'Failed to merge cart' });
  }
});

export default router;
