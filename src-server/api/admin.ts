import { Router } from 'express';
import { getFirebaseAdmin } from '../middleware/firebaseAdminInit.js';
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
  confirmOrderShipment,
  getAllOrdersAsync,
  updateOrderStatusAsync
  , confirmOrderShipmentAsync
} from '../services/orderService.js';
import {
  getAllUsersSanitized,
  setUserRole,
  getAllUsersSanitizedAsync,
  setUserRoleAsync,
  grantRewardsPoints,
  addVoucherToUser,
  setUserPassword,
  setUserPasswordAsync,
  verifyPassword,
  findUserByEmail,
  findUserByEmailAsync
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
    originalPrice: z.number().positive().optional(),
    description: z.string().min(1),
    category: z.string().min(1),
    imageUrl: z.string().url(),
    stock: z.number().int().nonnegative().optional(),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Champs invalides', details: parse.error.flatten() });
  const { name, price, originalPrice, description, category, imageUrl, stock } = parse.data;
  const product = isDbAvailable()
    ? await addProductAsync({ name, price, originalPrice, description, category, imageUrl, stock })
    : addProduct({ name, price, originalPrice, description, category, imageUrl, stock });
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

// === Create signed upload URL endpoint ===
router.post('/upload-url', async (req, res) => {
  try {
    const { filename, contentType } = req.body ?? {};
    if (!filename) return res.status(400).json({ message: 'filename is required' });
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `admin_uploads/${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safeName}`;
    const admin = getFirebaseAdmin();
    const bucket = process.env.STORAGE_BUCKET ? admin.storage().bucket(process.env.STORAGE_BUCKET) : admin.storage().bucket();
    const file = bucket.file(objectName);
    // Generate a signed URL for upload (write) valid for 15 minutes
    const [uploadUrl] = await file.getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000 });
    // Proxy URL for later retrieval (server will stream the object without making it public)
    const proxyUrl = `/api/admin/object/${encodeURIComponent(objectName)}`;
    return res.json({ uploadUrl, objectName, proxyUrl });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[admin upload-url] error', e);
    return res.status(500).json({ message: 'Échec de la génération de l\'URL', details: String(e) });
  }
});

// === Proxy endpoint to stream stored objects (no public ACLs) ===
router.get('/object/:name', async (req, res) => {
  try {
    const name = String(req.params.name);
    const objectName = decodeURIComponent(name);
    const admin = getFirebaseAdmin();
    const bucket = process.env.STORAGE_BUCKET ? admin.storage().bucket(process.env.STORAGE_BUCKET) : admin.storage().bucket();
    const file = bucket.file(objectName);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ message: 'Objet introuvable' });
    const [meta] = await file.getMetadata();
    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
    // Set cache control for public CDN use; objects remain non-public but cached by CDN/backend
    res.setHeader('Cache-Control', meta.cacheControl || 'public, max-age=31536000, s-maxage=31536000');
    const stream = file.createReadStream();
    stream.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[admin object stream] error', err);
      if (!res.headersSent) res.status(500).end('Stream error');
    });
    stream.pipe(res);
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[admin object] error', e);
    return res.status(500).json({ message: 'Erreur serveur', details: String(e) });
  }
});

// === Categories endpoint (derive from existing products) ===
router.get('/categories', async (_req, res) => {
  try {
    const products = isDbAvailable() ? await getAllProductsAsync() : getAllProducts();
    const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    return res.json(cats);
  } catch (e: any) {
    return res.status(500).json({ message: 'Impossible de récupérer les catégories', details: String(e) });
  }
});

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

// Admin confirms shipment (mark order as adminConfirmed=true)
router.patch('/orders/:id/confirm-shipment', async (req, res) => {
  const id = String(req.params.id);
  const updated = isDbAvailable() ? await confirmOrderShipmentAsync(id) : confirmOrderShipment(id);
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

router.post('/users/rewards', async (req, res) => {
  const schema = z.object({ email: z.string().email(), points: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides' });
  if (isDbAvailable()) return res.status(501).json({ message: 'Rewards points not implemented for DB yet' });
  const updated = grantRewardsPoints(parsed.data.email, parsed.data.points);
  if (!updated) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { passwordHash, ...sanitized } = updated;
  return res.json(sanitized);
});

router.post('/users/vouchers', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().min(3),
    amount: z.number().int().optional(),
    expiresAt: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides' });
  if (isDbAvailable()) return res.status(501).json({ message: 'Vouchers not implemented for DB yet' });
  const { email, code, amount, expiresAt } = parsed.data;
  const updated = addVoucherToUser(email, { code, amount, expiresAt });
  if (!updated) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { passwordHash, ...sanitized } = updated;
  return res.json(sanitized);
});

router.post('/users/password', async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides' });

  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Non authentifié' });

  const { currentPassword, newPassword } = parsed.data;

  const user = isDbAvailable() ? await findUserByEmailAsync(email) : findUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

  const ok = verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

  const updated = isDbAvailable()
    ? await setUserPasswordAsync(email, newPassword)
    : setUserPassword(email, newPassword);

  if (!updated) return res.status(500).json({ message: 'Impossible de mettre à jour le mot de passe' });

  return res.json({ success: true });
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

export default router;
