import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from '../services/produitService.js';
import { getAllOrders, updateOrderStatus } from '../services/orderService.js';
import { getAllUsersSanitized, setUserRole } from '../services/userService.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/produits', (_req, res) => {
  return res.json(getAllProducts());
});

router.post('/produits', (req, res) => {
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
  const { name, price, description, category, imageUrl } = parse.data;
  const product = addProduct({ name, price, description, category, imageUrl });
  return res.status(201).json(product);
});

router.put('/produits/:id', (req, res) => {
  const id = Number(req.params.id);
  const updated = updateProduct(id, req.body ?? {});
  if (!updated) return res.status(404).json({ message: 'Produit introuvable' });
  return res.json(updated);
});

router.delete('/produits/:id', (req, res) => {
  const id = Number(req.params.id);
  const ok = deleteProduct(id);
  if (!ok) return res.status(404).json({ message: 'Produit introuvable' });
  return res.status(204).send();
});

export default router;

// === Orders (admin) ===
router.get('/orders', (_req, res) => {
  return res.json(getAllOrders());
});

router.patch('/orders/:id', (req, res) => {
  const id = String(req.params.id);
  const schema = z.object({ status: z.enum(['paid', 'pending', 'failed']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Statut invalide' });
  const updated = updateOrderStatus(id, parsed.data.status);
  if (!updated) return res.status(404).json({ message: 'Commande introuvable' });
  return res.json(updated);
});

// === Users (admin) ===
router.get('/users', (_req, res) => {
  return res.json(getAllUsersSanitized());
});

router.patch('/users/role', (req, res) => {
  const schema = z.object({ email: z.string().email(), role: z.enum(['user', 'admin']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides' });
  const changed = setUserRole(parsed.data.email, parsed.data.role);
  if (!changed) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { passwordHash, ...sanitized } = changed;
  return res.json(sanitized);
});

// === Payments (derived) ===
router.get('/payments', (_req, res) => {
  const orders = getAllOrders();
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
