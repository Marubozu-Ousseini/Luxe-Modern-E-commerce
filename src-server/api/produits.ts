import { Router } from 'express';
import { isDbAvailable } from '../services/db.js';
import { getAllProducts, getAllProductsAsync } from '../services/produitService.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * @route   GET /api/produits
 * @desc    Récupérer tous les produits
 * @access  Public
 * @returns {Product[]} Une liste de produits.
 */
router.get('/', async (_req, res) => {
    try {
        const products = isDbAvailable() ? await getAllProductsAsync() : getAllProducts();
        res.json(products);
    } catch (error) {
        logger.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

export default router;
