import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isDbAvailable } from '../services/db.js';
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
  addProductAsync,
  deleteProductAsync,
  getAllProductsAsync,
  updateProductAsync
} from '../services/produitService.js';
import {
  getAllOrders,
  updateOrderStatus,
  getAllOrdersAsync,
  updateOrderStatusAsync
} from '../services/orderService.js';
import {
  getAllUsersSanitized,
  setUserRole,
  getAllUsersSanitizedAsync,
  setUserRoleAsync
} from '../services/userService.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/produits', async (_req, res) => {
  const products = isDbAvailable() ? await getAllProductsAsync() : getAllProducts();
  return res.json(products);
});

router.post('/produits', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    description: z.string().min(1),
    category: z.string().min(1),
    imageUrl: z.string().url(),
    stock: z.number().int().nonnegative().optional(),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Champs invalides', details: parse.error.flatten() });
  const { name, price, description, category, imageUrl, stock } = parse.data;
  const product = isDbAvailable()
    ? await addProductAsync({ name, price, description, category, imageUrl, stock })
    : addProduct({ name, price, description, category, imageUrl, stock });
  return res.status(201).json(product);
});

router.put('/produits/:id', async (req, res) => {
  const id = Number(req.params.id);
  const updated = isDbAvailable() ? await updateProductAsync(id, req.body ?? {}) : updateProduct(id, req.body ?? {});
  if (!updated) return res.status(404).json({ message: 'Produit introuvable' });
  return res.json(updated);
});

router.delete('/produits/:id', async (req, res) => {
  const id = Number(req.params.id);
  const ok = isDbAvailable() ? await deleteProductAsync(id) : deleteProduct(id);
  if (!ok) return res.status(404).json({ message: 'Produit introuvable' });
  return res.status(204).send();
});

export default router;

// === Orders (admin) ===
router.get('/orders', async (_req, res) => {
  const orders = isDbAvailable() ? await getAllOrdersAsync() : getAllOrders();
  return res.json(orders);
});

router.patch('/orders/:id', async (req, res) => {
  const id = String(req.params.id);
  const schema = z.object({ status: z.enum(['paid', 'pending', 'failed']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Statut invalide' });
  const updated = isDbAvailable() ? await updateOrderStatusAsync(id, parsed.data.status) : updateOrderStatus(id, parsed.data.status);
  if (!updated) return res.status(404).json({ message: 'Commande introuvable' });
  return res.json(updated);
});

// === Users (admin) ===
router.get('/users', async (_req, res) => {
  const users = isDbAvailable() ? await getAllUsersSanitizedAsync() : getAllUsersSanitized();
  return res.json(users);
});

router.patch('/users/role', async (req, res) => {
  const schema = z.object({ email: z.string().email(), role: z.enum(['user', 'admin']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides' });
  const changed = isDbAvailable() ? await setUserRoleAsync(parsed.data.email, parsed.data.role) : setUserRole(parsed.data.email, parsed.data.role);
  if (!changed) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { passwordHash, ...sanitized } = changed;
  return res.json(sanitized);
});

// === Payments (derived) ===
router.get('/payments', async (_req, res) => {
  const orders = isDbAvailable() ? await getAllOrdersAsync() : getAllOrders();
  // Derive a minimal payments view
  const payments = orders.map(o => ({
    id: o.id,
    userId: o.userId,
    amount: o.total,
    currency: o.currency,
    status: o.status,
    createdAt: o.createdAt,
  }));
  return res.json(payments);
});
