// Ce fichier simule la couche d'accès aux données (par exemple, des appels à une base de données PostgreSQL).
// Pour l'instant, il renvoie des données statiques.

import type { Product } from '../../types.js'; // Types partagés (NodeNext: utiliser l'extension .js côté import)
import { query, isDbAvailable } from './db.js';
import {
  addProductFs,
  deleteProductFs,
  getAllProductsFs,
  getProductsFs,
  updateProductFs,
} from './productsFirestoreService.js';
import {
  addProductToCatalog,
  deleteProductFromCatalog,
  getAllProductsFromCatalog,
  getProductsFromCatalog,
  seedProductsCatalogIfMissing,
  updateProductInCatalog,
} from './productsGcsService.js';
import { getProductExtrasMap } from './productExtrasGcsService.js';

// Option B: we keep the DB schema unchanged and persist optional merchandising fields in GCS.

export function isProductsPersistenceAvailable(): boolean {
  return (
    isDbAvailable() ||
    process.env.USE_FIRESTORE === 'true' ||
    process.env.USE_GCS_PRODUCTS === 'true'
  );
}

function normalizeImageUrlForClient(imageUrl: unknown): string {
  const raw = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  if (!raw) return '';

  // If the URL already is a relative proxy URL, keep it.
  if (raw.startsWith('/api/media/')) return raw;

  // If the stored URL contains our media proxy path but was saved with an origin
  // (e.g. http://localhost:3000/api/media/... or https://<project>.web.app/api/media/...),
  // return only the path so it works across domains/environments.
  const idx = raw.indexOf('/api/media/');
  if (idx >= 0) {
    const sliced = raw.slice(idx);
    return sliced.startsWith('/') ? sliced : `/${sliced}`;
  }

  return raw;
}

function normalizeImageUrlsForClient(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((v) => normalizeImageUrlForClient(v))
    .filter((v) => typeof v === 'string' && v.trim().length > 0);
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
}

function normalizeProductForClient(p: Product): Product {
  const normalized = normalizeImageUrlForClient((p as any).imageUrl);
  const images = normalizeImageUrlsForClient((p as any).images);
  const colors = normalizeStringArray((p as any).colors);
  const sizes = normalizeStringArray((p as any).sizes);
  const editorNote = typeof (p as any).editorNote === 'string' ? String((p as any).editorNote) : undefined;
  return {
    ...p,
    imageUrl: normalized || p.imageUrl,
    images: images.length ? images : (p as any).images,
    colors: colors.length ? colors : (p as any).colors,
    sizes: sizes.length ? sizes : (p as any).sizes,
    editorNote,
  };
}

function applyExtrasFromMap(p: Product, extrasMap: Record<string, any> | null): Product {
  const id = Number((p as any)?.id);
  if (!extrasMap || !Number.isFinite(id)) return p;
  const extra = extrasMap[String(id)];
  if (!extra || typeof extra !== 'object') return p;

  const images = normalizeImageUrlsForClient((extra as any).images);
  const colors = normalizeStringArray((extra as any).colors);
  const sizes = normalizeStringArray((extra as any).sizes);
  const editorNote = typeof (extra as any).editorNote === 'string' ? String((extra as any).editorNote).trim() : '';

  const next: any = { ...(p as any) };
  if (images.length) {
    next.images = images;
    next.imageUrl = images[0];
  }
  if (colors.length) next.colors = colors;
  if (sizes.length) next.sizes = sizes;
  if (editorNote) next.editorNote = editorNote;
  return next as Product;
}

function isSampleProductsEnabled(): boolean {
  // By default, production must not show seeded/demo products.
  // Enable explicitly via USE_SAMPLE_PRODUCTS=true when needed.
  if (process.env.USE_SAMPLE_PRODUCTS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

function isGcsProductsEnabled(): boolean {
  return process.env.USE_GCS_PRODUCTS === 'true';
}

const sampleProducts: Product[] = [
    {
    id: 1,
  name: 'Montre Chronographe Soul',
  price: 199000,
  originalPrice: 225000,
    description: "Fabriquée en acajou, cette guitare acoustique offre des tons chauds et résonnants, parfaits pour les mélodies soul et les performances intimes.",
  category: 'Montres',
    imageUrl: 'https://picsum.photos/seed/guitar/600/600',
      rating: { rate: 4.7, count: 130 },
      labels: ['mieux-note']
  },
  {
    id: 2,
  name: 'Chaussure Cuir Classique',
  price: 149000,
  originalPrice: 175000,
    description: "Capturez des moments avec une touche classique. Cet appareil photo argentique 35mm combine une esthétique rétro avec une mécanique fiable.",
  category: 'Chaussures',
    imageUrl: 'https://picsum.photos/seed/camera/600/600',
    limitedAvailability: true,
    rating: { rate: 4.8, count: 250 },
    labels: ['meilleure-vente']
  },
  {
    id: 3,
  name: 'Veste Minimaliste en Cuir',
    price: 125000,
    description: "Élégante et sobre, cette montre dispose d'un bracelet en cuir véritable et d'un cadran épuré. Un accessoire sophistiqué pour toute occasion.",
  category: 'Prêt-à-porter',
    imageUrl: 'https://picsum.photos/seed/watch/600/600',
    rating: { rate: 4.5, count: 420 },
    labels: []
  },
  {
    id: 4,
  name: 'Chemise Pour-Over en Coton',
    price: 55000,
    description: "Élevez votre rituel café avec ce set pour-over en céramique. Comprend un dripper et une carafe pour une infusion parfaite et artisanale.",
  category: 'Prêt-à-porter',
    imageUrl: 'https://picsum.photos/seed/coffee/600/600',
    rating: { rate: 4.9, count: 310 },
    labels: ['nouveaute']
  },
  {
    id: 5,
  name: "Sac à Dos Urbain en Toile",
    price: 78000,
    description: "Durable et stylé, ce sac à dos en toile est prêt pour l'aventure. Avec de multiples compartiments, il est parfait pour la ville ou les escapades.",
  category: 'Accessoires',
    imageUrl: 'https://picsum.photos/seed/backpack/600/600',
    limitedAvailability: true,
    rating: { rate: 4.6, count: 550 },
    labels: []
  },
  {
    id: 6,
  name: 'Chaussure de Ville Hi-Fi',
  price: 259000,
  originalPrice: 295000,
    description: "Vivez un son immersif haute-fidélité avec ces enceintes compactes. Finition bois élégante et drivers audio puissants.",
  category: 'Chaussures',
    imageUrl: 'https://picsum.photos/seed/speakers/600/600',
    rating: { rate: 4.8, count: 180 },
    labels: []
  },
  {
    id: 9,
  name: 'Montre Connectée Réduction de Bruit',
  price: 175000,
  originalPrice: 195000,
    description: "Plongez dans un son pur avec ce casque circum-aural premium. Réduction de bruit active, coussinets moelleux et 30 heures d'autonomie.",
  category: 'Montres',
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    rating: { rate: 4.9, count: 850 },
    labels: []
  },
  {
    id: 12,
  name: 'Pantalon Intérieur Intelligent',
    price: 140000,
    description: "Cultivez des herbes fraîches toute l'année. Arrosage automatisé et lumières de croissance LED pour un jardinage facile.",
  category: 'Prêt-à-porter',
    imageUrl: 'https://picsum.photos/seed/garden/600/600',
    limitedAvailability: true,
    rating: { rate: 4.7, count: 220 },
    labels: []
  },
  {
    id: 13,
    name: 'Parfum Ambre Nocturne',
    price: 95000,
    description: 'Eau de parfum chaude et enveloppante, mêlant ambre, vanille et notes boisées pour les soirées élégantes.',
    category: 'Parfums',
    imageUrl: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: { rate: 4.8, count: 180 },
    labels: []
  },
  {
    id: 14,
    name: 'Brume Parfumée Coton Doux',
    price: 45000,
    description: 'Body mist léger aux notes de coton frais et musc blanc, parfait pour un sillage discret au quotidien.',
    category: 'Parfums',
    imageUrl: 'https://images.pexels.com/photos/3735613/pexels-photo-3735613.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: { rate: 4.6, count: 95 },
    labels: []
  },
  {
    id: 15,
    name: 'Coffret Découverte Brumes',
    price: 78000,
    description: 'Set de trois brumes parfumées (fleur d’oranger, thé blanc, figue) pour varier les ambiances selon vos envies.',
    category: 'Parfums',
    imageUrl: 'https://images.pexels.com/photos/4202922/pexels-photo-4202922.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: { rate: 4.7, count: 120 },
    labels: []
  },
  {
    id: 16,
    name: 'Montre Automatique Sable',
    price: 289000,
    originalPrice: 320000,
    description: "Montre automatique au cadran sable et index sobres, bracelet cuir pleine fleur. Élégance intemporelle au poignet.",
    category: 'Montres',
    imageUrl: 'https://picsum.photos/seed/watchauto/600/600',
    rating: { rate: 4.8, count: 210 },
    labels: []
  },
  {
    id: 17,
    name: 'Sneakers Minimalistes en Nubuck',
    price: 110000,
    originalPrice: 129000,
    description: "Silhouette épurée, empeigne en nubuck souple et semelle ton-sur-ton pour un confort discret et moderne.",
    category: 'Chaussures',
    imageUrl: 'https://picsum.photos/seed/sneaker/600/600',
    rating: { rate: 4.6, count: 340 },
    labels: []
  },
  {
    id: 18,
    name: 'Ceinture en Cuir Grainé',
    price: 45000,
    description: "Cuir grainé italien, boucle finition brossée. L’allié discret pour structurer vos silhouettes.",
    category: 'Accessoires',
    imageUrl: 'https://picsum.photos/seed/belt/600/600',
    rating: { rate: 4.5, count: 95 },
    labels: []
  },
  {
    id: 19,
    name: 'Lunettes de Soleil Acétate',
    price: 69000,
    description: "Monture en acétate premium, verres UV400 teinte thé. Ligne douce et raffinée.",
    category: 'Accessoires',
    imageUrl: 'https://picsum.photos/seed/sunglasses/600/600',
    rating: { rate: 4.7, count: 140 },
    labels: []
  },
];

async function ensureGcsSeeded() {
  if (!isGcsProductsEnabled()) return;
  if (!isSampleProductsEnabled()) return;
  await seedProductsCatalogIfMissing(sampleProducts);
}

/**
 * Récupère tous les produits.
 * Dans une application réelle, cette fonction interagirait avec une base de données.
 * @returns {Product[]} La liste de tous les produits.
 */
export function getAllProducts(): Product[] {
  // In production, do not fall back to demo/sample products unless explicitly enabled.
  if (!isSampleProductsEnabled()) return [];
  return sampleProducts;
}

export async function getAllProductsAsync(): Promise<Product[]> {
  if (isDbAvailable()) {
    let extrasMap: any = null;
    try {
      extrasMap = await getProductExtrasMap();
    } catch {
      extrasMap = null;
    }

    const { rows } = await query<any>(
      'SELECT id, name, price, original_price as "originalPrice", description, category, image_url as "imageUrl", stock, limited_availability as "limitedAvailability", rating_rate as "ratingRate", rating_count as "ratingCount", labels FROM products ORDER BY id ASC'
    );

    return rows.map((r) =>
      normalizeProductForClient(
        applyExtrasFromMap(
          {
            id: r.id,
            name: r.name,
            price: r.price,
            originalPrice: r.originalPrice ?? undefined,
            description: r.description,
            category: r.category,
            imageUrl: r.imageUrl,
            stock: r.stock ?? 0,
            limitedAvailability: r.limitedAvailability || undefined,
            rating: { rate: Number(r.ratingRate || 0), count: Number(r.ratingCount || 0) },
            labels: Array.isArray(r.labels) ? r.labels : r.labels ? JSON.parse(r.labels) : undefined,
          } as any,
          extrasMap
        )
      )
    );
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return (await getAllProductsFs()).map(normalizeProductForClient);
  }

  if (isGcsProductsEnabled()) {
    await ensureGcsSeeded();
    return (await getAllProductsFromCatalog()).map(normalizeProductForClient);
  }

  return getAllProducts().map(normalizeProductForClient);
}

export function getProducts(opts?: { q?: string; limit?: number; offset?: number }): Product[] {
  const { q, limit, offset } = opts || {};
  let list = [...getAllProducts()];
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(ql) || p.description.toLowerCase().includes(ql) || p.category.toLowerCase().includes(ql));
  }
  const start = Math.max(0, offset || 0);
  const end = limit ? start + limit : undefined;
  return list.slice(start, end);
}

export async function getProductsAsync(opts?: { q?: string; limit?: number; offset?: number }): Promise<Product[]> {
  if (isDbAvailable()) {
    let extrasMap: any = null;
    try {
      extrasMap = await getProductExtrasMap();
    } catch {
      extrasMap = null;
    }

    const clauses: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (opts?.q) {
      clauses.push('(lower(name) LIKE $' + i + ' OR lower(description) LIKE $' + i + ' OR lower(category) LIKE $' + i + ')');
      values.push(`%${opts.q.toLowerCase()}%`);
      i++;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    let sql = `SELECT id, name, price, original_price as "originalPrice", description, category, image_url as "imageUrl", stock, limited_availability as "limitedAvailability", rating_rate as "ratingRate", rating_count as "ratingCount", labels FROM products ${where} ORDER BY id ASC`;
    if (opts?.limit) {
      sql += ` LIMIT $${i++}`;
      values.push(opts.limit);
    }
    if (opts?.offset) {
      sql += ` OFFSET $${i++}`;
      values.push(opts.offset);
    }
    const { rows } = await query<any>(sql, values);
    return rows.map((r) =>
      normalizeProductForClient(
        applyExtrasFromMap(
          {
            id: r.id,
            name: r.name,
            price: r.price,
            originalPrice: r.originalPrice ?? undefined,
            description: r.description,
            category: r.category,
            imageUrl: r.imageUrl,
            stock: r.stock ?? 0,
            limitedAvailability: r.limitedAvailability || undefined,
            rating: { rate: Number(r.ratingRate || 0), count: Number(r.ratingCount || 0) },
            labels: Array.isArray(r.labels) ? r.labels : r.labels ? JSON.parse(r.labels) : undefined,
          } as any,
          extrasMap
        )
      )
    );
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return (await getProductsFs(opts)).map(normalizeProductForClient);
  }

  if (isGcsProductsEnabled()) {
    await ensureGcsSeeded();
    return (await getProductsFromCatalog(opts)).map(normalizeProductForClient);
  }

  return getProducts(opts).map(normalizeProductForClient);
}

export function addProduct(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Product {
  if (!isSampleProductsEnabled()) {
    throw new Error('Sample products are disabled; enable persistence (DB/GCS) or set USE_SAMPLE_PRODUCTS=true for demo mode.');
  }
  const id = Math.max(0, ...sampleProducts.map(p => p.id)) + 1;
  const product: Product = { id, rating: newProduct.rating || { rate: 0, count: 0 }, stock: newProduct.stock ?? 0, ...newProduct };
  sampleProducts.push(product);
  return product;
}

export async function addProductAsync(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Promise<Product> {
  if (isDbAvailable()) {
    const result = await query<any>(
      'INSERT INTO products (name, price, original_price, description, category, image_url, stock, limited_availability, rating_rate, rating_count, labels) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [
        newProduct.name,
        newProduct.price,
        newProduct.originalPrice ?? null,
        newProduct.description,
        newProduct.category,
        newProduct.imageUrl,
        newProduct.stock ?? 0,
        newProduct.limitedAvailability ?? false,
        newProduct.rating?.rate ?? 0,
        newProduct.rating?.count ?? 0,
        JSON.stringify(newProduct.labels ?? []),
      ]
    );
    const id = result.rows[0].id;
    return normalizeProductForClient({ id, rating: newProduct.rating || { rate: 0, count: 0 }, ...newProduct } as Product);
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return normalizeProductForClient(await addProductFs(newProduct));
  }

  if (isGcsProductsEnabled()) {
    await ensureGcsSeeded();
    return normalizeProductForClient(await addProductToCatalog(newProduct));
  }

  return addProduct(newProduct);
}

export function updateProduct(id: number, updates: Partial<Omit<Product, 'id'>>): Product | undefined {
  if (!isSampleProductsEnabled()) {
    throw new Error('Sample products are disabled; enable persistence (DB/GCS) or set USE_SAMPLE_PRODUCTS=true for demo mode.');
  }
  const idx = sampleProducts.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  sampleProducts[idx] = { ...sampleProducts[idx], ...updates };
  return sampleProducts[idx];
}

export async function updateProductAsync(id: number, updates: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
  if (isDbAvailable()) {
    // Build dynamic SET clause
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    const map: Record<string, any> = {
      name: updates.name,
      price: updates.price,
      original_price: updates.originalPrice,
      description: updates.description,
      category: updates.category,
      image_url: updates.imageUrl,
      stock: updates.stock,
      limited_availability: updates.limitedAvailability,
      labels: updates.labels ? JSON.stringify(updates.labels) : undefined,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { fields.push(`${col}=$${i++}`); values.push(val); }
    }
    if (fields.length === 0) {
      const all = await getAllProductsAsync();
      return all.find(p => p.id === id);
    }
    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id=$${i} RETURNING id`;
    const res = await query<any>(sql, values);
    if (!res.rows[0]) return undefined;
    const all = await getAllProductsAsync();
    return all.find(p => p.id === id);
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return updateProductFs(id, updates);
  }

  if (isGcsProductsEnabled()) {
    await ensureGcsSeeded();
    return updateProductInCatalog(id, updates as any);
  }

  return updateProduct(id, updates);
}

export function deleteProduct(id: number): boolean {
  if (!isSampleProductsEnabled()) {
    throw new Error('Sample products are disabled; enable persistence (DB/GCS) or set USE_SAMPLE_PRODUCTS=true for demo mode.');
  }
  const idx = sampleProducts.findIndex(p => p.id === id);
  if (idx === -1) return false;
  sampleProducts.splice(idx, 1);
  return true;
}

export async function deleteProductAsync(id: number): Promise<boolean> {
  if (isDbAvailable()) {
    const res = await query<any>('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
    return !!res.rows[0];
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return deleteProductFs(id);
  }

  if (isGcsProductsEnabled()) {
    await ensureGcsSeeded();
    return deleteProductFromCatalog(id);
  }

  return deleteProduct(id);
}
