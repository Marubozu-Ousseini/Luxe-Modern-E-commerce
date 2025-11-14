import { Product } from '../types.ts';

/**
 * Récupère la liste de tous les produits depuis l'API backend.
 * @returns Une promesse qui se résout avec un tableau de produits.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch('/api/produits');
    if (!response.ok) {
      // Gère les erreurs HTTP comme 404 ou 500
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const products: Product[] = await response.json();
    return products;
  } catch (error) {
    // Gère les erreurs réseau ou de parsing JSON
    console.error("Impossible de récupérer les produits:", error);
    // Propage l'erreur pour que le composant appelant puisse la gérer
    throw error;
  }
};