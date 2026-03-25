import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isDbAvailable } from '../services/db.js';
import { getAllProducts, getAllProductsAsync, isProductsPersistenceAvailable } from '../services/produitService.js';
import { createOrder, getOrdersByUser, createOrderAsync, getOrdersByUserAsync } from '../services/orderService.js';

const router = Router();

router.use(requireAuth);


router.get('/me', async (req, res) => {
  const userId = req.user!.id;
  const orders = isDbAvailable() ? await getOrdersByUserAsync(userId) : getOrdersByUser(userId);
  // Add product names to each order's items
  let products: any[] = [];
  try {
    const { getAllProducts, getAllProductsAsync, isProductsPersistenceAvailable } = await import('../services/produitService.js');
    products = isProductsPersistenceAvailable() ? await getAllProductsAsync() : getAllProducts();
  } catch {}
  const productById = new Map(products.map((p: any) => [p.id, p]));
  // Get user address (town) from userService
  let userTown = "";
  try {
    const { findUserById } = await import('../services/userService.js');
    const user = findUserById(userId);
    userTown = user?.town || "";
  } catch {}
  const hydrated = (Array.isArray(orders) ? orders : []).map((order: any) => ({
    ...order,
    address: order.address || order.town || userTown,
    items: (order.items || []).map((it: any) => ({
      ...it,
      name: productById.get(it.productId)?.name || `Produit ${it.productId}`,
    })),
  }));
  return res.json(hydrated);
});

router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const items = req.body?.items as { productId: number; quantity: number }[];
    const paymentMethod = req.body?.paymentMethod as 'orange_money' | 'mtn_mobile_money' | 'on_delivery' | undefined;
    const couponCode = String(req.body?.couponCode || '').trim().toUpperCase() || undefined;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Panier vide' });
    const products = isProductsPersistenceAvailable() ? await getAllProductsAsync() : getAllProducts();
      const order = isDbAvailable() ? await createOrderAsync(userId, products, items, paymentMethod, couponCode) : createOrder(userId, products, items, paymentMethod, couponCode);
    return res.status(201).json(order);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Commande échouée' });
  }
});

export default router;
