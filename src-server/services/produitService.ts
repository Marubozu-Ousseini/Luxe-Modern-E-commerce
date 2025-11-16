// Ce fichier simule la couche d'accès aux données (par exemple, des appels à une base de données PostgreSQL).
// Pour l'instant, il renvoie des données statiques.

import type { Product } from '../../types.js'; // Types partagés (NodeNext: utiliser l'extension .js côté import)
import { query, isDbAvailable } from './db.js';

const products: Product[] = [
    {
    id: 1,
  name: 'Montre Chronographe Soul',
  price: 199000,
  originalPrice: 225000,
    description: "Fabriquée en acajou, cette guitare acoustique offre des tons chauds et résonnants, parfaits pour les mélodies soul et les performances intimes.",
  category: 'Montres',
    imageUrl: 'https://picsum.photos/seed/guitar/600/600',
    rating: { rate: 4.7, count: 130 }
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
    rating: { rate: 4.8, count: 250 }
  },
  {
    id: 3,
  name: 'Veste Minimaliste en Cuir',
    price: 125000,
    description: "Élégante et sobre, cette montre dispose d'un bracelet en cuir véritable et d'un cadran épuré. Un accessoire sophistiqué pour toute occasion.",
  category: 'Prêt-à-Porter',
    imageUrl: 'https://picsum.photos/seed/watch/600/600',
    rating: { rate: 4.5, count: 420 }
  },
  {
    id: 4,
  name: 'Chemise Pour-Over en Coton',
    price: 55000,
    description: "Élevez votre rituel café avec ce set pour-over en céramique. Comprend un dripper et une carafe pour une infusion parfaite et artisanale.",
  category: 'Prêt-à-Porter',
    imageUrl: 'https://picsum.photos/seed/coffee/600/600',
    rating: { rate: 4.9, count: 310 }
  },
  {
    id: 5,
  name: "Sac à Dos Urbain en Toile",
    price: 78000,
    description: "Durable et stylé, ce sac à dos en toile est prêt pour l'aventure. Avec de multiples compartiments, il est parfait pour la ville ou les escapades.",
  category: 'Prêt-à-Porter',
    imageUrl: 'https://picsum.photos/seed/backpack/600/600',
    limitedAvailability: true,
    rating: { rate: 4.6, count: 550 }
  },
  {
    id: 6,
  name: 'Chaussure de Ville Hi-Fi',
  price: 259000,
  originalPrice: 295000,
    description: "Vivez un son immersif haute-fidélité avec ces enceintes compactes. Finition bois élégante et drivers audio puissants.",
  category: 'Chaussures',
    imageUrl: 'https://picsum.photos/seed/speakers/600/600',
    rating: { rate: 4.8, count: 180 }
  },
  {
    id: 9,
  name: 'Montre Connectée Réduction de Bruit',
  price: 175000,
  originalPrice: 195000,
    description: "Plongez dans un son pur avec ce casque circum-aural premium. Réduction de bruit active, coussinets moelleux et 30 heures d'autonomie.",
  category: 'Montres',
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    rating: { rate: 4.9, count: 850 }
  },
  {
    id: 12,
  name: 'Pantalon Intérieur Intelligent',
    price: 140000,
    description: "Cultivez des herbes fraîches toute l'année. Arrosage automatisé et lumières de croissance LED pour un jardinage facile.",
  category: 'Prêt-à-Porter',
    imageUrl: 'https://picsum.photos/seed/garden/600/600',
    limitedAvailability: true,
    rating: { rate: 4.7, count: 220 }
  },
];

/**
 * Récupère tous les produits.
 * Dans une application réelle, cette fonction interagirait avec une base de données.
 * @returns {Product[]} La liste de tous les produits.
 */
export function getAllProducts(): Product[] {
    // Simule un appel à la base de données
    return products;
}

export async function getAllProductsAsync(): Promise<Product[]> {
  if (!isDbAvailable()) return getAllProducts();
  const { rows } = await query<any>('SELECT id, name, price, original_price as "originalPrice", description, category, image_url as "imageUrl", stock, limited_availability as "limitedAvailability", rating_rate as "ratingRate", rating_count as "ratingCount" FROM products ORDER BY id ASC');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    description: r.description,
    category: r.category,
    imageUrl: r.imageUrl,
    stock: r.stock ?? 0,
    limitedAvailability: r.limitedAvailability || undefined,
    rating: { rate: Number(r.ratingRate || 0), count: Number(r.ratingCount || 0) }
  }));
}

export function getProducts(opts?: { q?: string; limit?: number; offset?: number }): Product[] {
  const { q, limit, offset } = opts || {};
  let list = [...products];
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(ql) || p.description.toLowerCase().includes(ql) || p.category.toLowerCase().includes(ql));
  }
  const start = Math.max(0, offset || 0);
  const end = limit ? start + limit : undefined;
  return list.slice(start, end);
}

export async function getProductsAsync(opts?: { q?: string; limit?: number; offset?: number }): Promise<Product[]> {
  if (!isDbAvailable()) return getProducts(opts);
  const clauses: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (opts?.q) {
    clauses.push('(lower(name) LIKE $' + i + ' OR lower(description) LIKE $' + i + ' OR lower(category) LIKE $' + i + ')');
    values.push(`%${opts.q.toLowerCase()}%`);
    i++;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  let sql = `SELECT id, name, price, original_price as "originalPrice", description, category, image_url as "imageUrl", stock, limited_availability as "limitedAvailability", rating_rate as "ratingRate", rating_count as "ratingCount" FROM products ${where} ORDER BY id ASC`; 
  if (opts?.limit) { sql += ` LIMIT $${i++}`; values.push(opts.limit); }
  if (opts?.offset) { sql += ` OFFSET $${i++}`; values.push(opts.offset); }
  const { rows } = await query<any>(sql, values);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    price: r.price,
    originalPrice: r.originalPrice ?? undefined,
    description: r.description,
    category: r.category,
    imageUrl: r.imageUrl,
    stock: r.stock ?? 0,
    limitedAvailability: r.limitedAvailability || undefined,
    rating: { rate: Number(r.ratingRate || 0), count: Number(r.ratingCount || 0) }
  }));
}

export function addProduct(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Product {
  const id = Math.max(0, ...products.map(p => p.id)) + 1;
  const product: Product = { id, rating: newProduct.rating || { rate: 0, count: 0 }, stock: newProduct.stock ?? 0, ...newProduct };
  products.push(product);
  return product;
}

export async function addProductAsync(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Promise<Product> {
  if (!isDbAvailable()) return addProduct(newProduct);
  const result = await query<any>('INSERT INTO products (name, price, original_price, description, category, image_url, stock, limited_availability, rating_rate, rating_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [
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
  ]);
  const id = result.rows[0].id;
  return { id, rating: newProduct.rating || { rate: 0, count: 0 }, ...newProduct };
}

export function updateProduct(id: number, updates: Partial<Omit<Product, 'id'>>): Product | undefined {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  products[idx] = { ...products[idx], ...updates };
  return products[idx];
}

export async function updateProductAsync(id: number, updates: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
  if (!isDbAvailable()) return updateProduct(id, updates);
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

export function deleteProduct(id: number): boolean {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  return true;
}

export async function deleteProductAsync(id: number): Promise<boolean> {
  if (!isDbAvailable()) return deleteProduct(id);
  const res = await query<any>('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
  return !!res.rows[0];
}
