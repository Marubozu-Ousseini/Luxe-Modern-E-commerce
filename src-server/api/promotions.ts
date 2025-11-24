import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getPromotions, updatePromotions } from '../services/promotionsService.js';

const router = Router();

// Public endpoint: clients fetch current promotions/vouchers state
router.get('/', (_req, res) => {
  return res.json(getPromotions());
});

// Admin-only sub-routes to manage promotions
router.use('/admin', requireAuth, requireAdmin);

router.get('/admin', (_req, res) => {
  return res.json(getPromotions());
});

router.put('/admin', (req, res) => {
  const bgSchema = z.object({
    desktop: z.string().url().or(z.string().min(1)).optional(),
    mobile: z.string().url().or(z.string().min(1)).optional(),
    fallback: z.array(z.string().min(1)).optional(),
    alt: z.string().min(1).max(120).optional(),
  }).partial();
  const pageBackgroundsSchema = z.object({
    home: bgSchema.optional(),
    showroom: bgSchema.optional(),
    galeries: bgSchema.optional(),
    story: bgSchema.optional(),
    admin: bgSchema.optional(),
  }).partial();
  const stickersSchema = z.array(z.object({
    id: z.string().min(1),
    text: z.string().max(60).optional(),
    imageUrl: z.string().url().optional(),
    href: z.string().url().optional(),
  })).optional();
  const schema = z.object({
    promotionsActive: z.boolean().optional(),
    vouchersActive: z.boolean().optional(),
    bannerText: z.string().min(1).max(200).optional(),
    voucherText: z.string().min(1).max(200).optional(),
    loginBackground: bgSchema.optional(),
    pageBackgrounds: pageBackgroundsSchema.optional(),
    marqueeSpeedSeconds: z.number().int().min(4).max(120).optional(),
    glowEnabled: z.boolean().optional(),
  stickers: stickersSchema,
  });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ message: 'Paramètres invalides', details: parsed.error.flatten() });
  const updated = updatePromotions(parsed.data as any);
  return res.json(updated);
});

export default router;
