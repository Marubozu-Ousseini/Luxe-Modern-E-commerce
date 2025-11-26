import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use an explicit writable directory inside the container when running in
// production (Cloud Run) — /tmp is writable. Allow overriding via DATA_DIR.
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(os.tmpdir(), 'luxe-data');
const promosFile = path.join(dataDir, 'promotions.json');

export interface PromotionsState {
  promotionsActive: boolean;
  vouchersActive: boolean;
  bannerText: string;
  voucherText: string;
  loginBackground?: {
    desktop?: string;
    mobile?: string;
    fallback?: string[];
    alt?: string;
  };
  pageBackgrounds?: {
    home?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
    showroom?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
    galeries?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
    story?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
    admin?: { desktop?: string; mobile?: string; fallback?: string[]; alt?: string };
  };
  marqueeSpeedSeconds?: number; // animation speed for scrolling banner
  glowEnabled?: boolean; // toggle glow pulse
  stickers?: { id: string; text?: string; imageUrl?: string; href?: string }[]; // small promotional stickers
  updatedAt: string; // ISO date
}

const defaultState: PromotionsState = {
  promotionsActive: false,
  vouchersActive: false,
  bannerText: 'Promo en cours ! Profitez de nos meilleures offres ✨',
  voucherText: 'Utilisez vos bons et points de fidélité 🎁',
  loginBackground: {
    desktop: process.env.LOGIN_BG_DESKTOP || undefined,
    mobile: process.env.LOGIN_BG_MOBILE || undefined,
    fallback: [
      '/login-bg.jpg',
      '/login-bg.png',
      'https://images.unsplash.com/photo-1518551499312-89526d76c1a4?q=80&w=1600&auto=format&fit=crop'
    ],
    alt: 'Image de fond de la page de connexion'
  },
  pageBackgrounds: {
    home: { fallback: ['/home-bg.jpg', '/home-bg.png'], alt: "Image d'accueil" },
    showroom: { fallback: ['/showroom-bg.jpg'], alt: 'Image de fond Showroom' },
    galeries: { fallback: ['/galeries-bg.jpg'], alt: 'Image de fond Galeries' },
    story: { fallback: ['/story-bg.jpg'], alt: 'Image de fond Notre histoire' },
    admin: { fallback: ['/admin-bg.jpg'], alt: 'Image de fond Admin' },
  },
  marqueeSpeedSeconds: 18,
  glowEnabled: true,
  stickers: [
    { id: 'sticker-new', text: 'Nouveau', imageUrl: undefined },
    { id: 'sticker-offer', text: 'Offre Spéciale', imageUrl: undefined },
  ],
  updatedAt: new Date().toISOString(),
};

function ensureFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(promosFile)) fs.writeFileSync(promosFile, JSON.stringify(defaultState, null, 2));
}

export function getPromotions(): PromotionsState {
  ensureFile();
  try {
    const raw = fs.readFileSync(promosFile, 'utf-8');
    return JSON.parse(raw) as PromotionsState;
  } catch {
    return { ...defaultState, updatedAt: new Date().toISOString() };
  }
}

export function updatePromotions(patch: Partial<PromotionsState>): PromotionsState {
  ensureFile();
  const current = getPromotions();
  const next: PromotionsState = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(promosFile, JSON.stringify(next, null, 2));
  return next;
}
