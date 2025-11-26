import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isDbAvailable } from '../services/db.js';
import { getAllProducts, getAllProductsAsync } from '../services/produitService.js';
import { createOrder, getOrdersByUser, createOrderAsync, getOrdersByUserAsync } from '../services/orderService.js';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res) => {
  const userId = req.user!.id;
  const orders = isDbAvailable() ? await getOrdersByUserAsync(userId) : getOrdersByUser(userId);
  return res.json(orders);
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const items = req.body?.items as { productId: number; quantity: number }[];
      const paymentMethod = req.body?.paymentMethod as 'orange_money' | 'mtn_mobile_money' | 'on_delivery' | undefined;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Panier vide' });
    const products = isDbAvailable() ? await getAllProductsAsync() : getAllProducts();
      const order = isDbAvailable() ? await createOrderAsync(userId, products, items, paymentMethod) : createOrder(userId, products, items, paymentMethod);
    return res.status(201).json(order);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Commande échouée' });
  }
});

export default router;
