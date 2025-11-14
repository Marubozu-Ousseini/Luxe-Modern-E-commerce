import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from '../services/produitService.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/produits', (_req, res) => {
  return res.json(getAllProducts());
});

router.post('/produits', (req, res) => {
  const { name, price, description, category, imageUrl } = req.body;
  if (!name || !price || !description || !category || !imageUrl) return res.status(400).json({ message: 'Champs requis manquants' });
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
