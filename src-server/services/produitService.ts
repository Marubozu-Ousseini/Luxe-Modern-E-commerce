// Ce fichier simule la couche d'accès aux données (par exemple, des appels à une base de données PostgreSQL).
// Pour l'instant, il renvoie des données statiques.

import type { Product } from '../../types.js'; // Types partagés (NodeNext: utiliser l'extension .js côté import)

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

export function addProduct(newProduct: Omit<Product, 'id' | 'rating'> & { rating?: Product['rating'] }): Product {
  const id = Math.max(0, ...products.map(p => p.id)) + 1;
  const product: Product = { id, rating: newProduct.rating || { rate: 0, count: 0 }, ...newProduct };
  products.push(product);
  return product;
}

export function updateProduct(id: number, updates: Partial<Omit<Product, 'id'>>): Product | undefined {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  products[idx] = { ...products[idx], ...updates };
  return products[idx];
}

export function deleteProduct(id: number): boolean {
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  return true;
}
