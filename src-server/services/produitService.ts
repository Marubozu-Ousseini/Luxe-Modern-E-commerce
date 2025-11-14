// Ce fichier simule la couche d'accès aux données (par exemple, des appels à une base de données PostgreSQL).
// Pour l'instant, il renvoie des données statiques.

import { Product } from '../../src/types'; // On réutilise les types du frontend

const products: Product[] = [
    {
    id: 1,
    name: 'Guitare Acoustique Soul',
    price: 225000,
    description: "Fabriquée en acajou, cette guitare acoustique offre des tons chauds et résonnants, parfaits pour les mélodies soul et les performances intimes.",
    category: 'Musique',
    imageUrl: 'https://picsum.photos/seed/guitar/600/600',
    rating: { rate: 4.7, count: 130 }
  },
  {
    id: 2,
    name: 'Appareil Photo Argentique Vintage',
    price: 175000,
    description: "Capturez des moments avec une touche classique. Cet appareil photo argentique 35mm combine une esthétique rétro avec une mécanique fiable.",
    category: 'Électronique',
    imageUrl: 'https://picsum.photos/seed/camera/600/600',
    rating: { rate: 4.8, count: 250 }
  },
  {
    id: 3,
    name: 'Montre Minimaliste en Cuir',
    price: 125000,
    description: "Élégante et sobre, cette montre dispose d'un bracelet en cuir véritable et d'un cadran épuré. Un accessoire sophistiqué pour toute occasion.",
    category: 'Accessoires',
    imageUrl: 'https://picsum.photos/seed/watch/600/600',
    rating: { rate: 4.5, count: 420 }
  },
  {
    id: 4,
    name: 'Set à Café Pour-Over en Céramique',
    price: 55000,
    description: "Élevez votre rituel café avec ce set pour-over en céramique. Comprend un dripper et une carafe pour une infusion parfaite et artisanale.",
    category: 'Maison',
    imageUrl: 'https://picsum.photos/seed/coffee/600/600',
    rating: { rate: 4.9, count: 310 }
  },
  {
    id: 5,
    name: "Sac à Dos d'Aventure en Toile",
    price: 78000,
    description: "Durable et stylé, ce sac à dos en toile est prêt pour l'aventure. Avec de multiples compartiments, il est parfait pour la ville ou les escapades.",
    category: 'Sacs',
    imageUrl: 'https://picsum.photos/seed/backpack/600/600',
    rating: { rate: 4.6, count: 550 }
  },
  {
    id: 6,
    name: 'Enceintes de Bibliothèque Hi-Fi',
    price: 295000,
    description: "Vivez un son immersif haute-fidélité avec ces enceintes compactes. Finition bois élégante et drivers audio puissants.",
    category: 'Électronique',
    imageUrl: 'https://picsum.photos/seed/speakers/600/600',
    rating: { rate: 4.8, count: 180 }
  },
  {
    id: 9,
    name: 'Casque sans Fil à Réduction de Bruit',
    price: 195000,
    description: "Plongez dans un son pur avec ce casque circum-aural premium. Réduction de bruit active, coussinets moelleux et 30 heures d'autonomie.",
    category: 'Électronique',
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    rating: { rate: 4.9, count: 850 }
  },
  {
    id: 12,
    name: 'Kit de Jardin d’Intérieur Intelligent',
    price: 140000,
    description: "Cultivez des herbes fraîches toute l'année. Arrosage automatisé et lumières de croissance LED pour un jardinage facile.",
    category: 'Maison',
    imageUrl: 'https://picsum.photos/seed/garden/600/600',
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
