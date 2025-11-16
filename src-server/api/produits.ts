import { Router } from 'express';
import { isDbAvailable } from '../services/db.js';
import { getProducts, getProductsAsync } from '../services/produitService.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * @route   GET /api/produits
 * @desc    Récupérer tous les produits
 * @access  Public
 * @returns {Product[]} Une liste de produits.
 */
router.get('/', async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const offset = req.query.offset ? Number(req.query.offset) : undefined;
        const products = isDbAvailable() ? await getProductsAsync({ q, limit, offset }) : getProducts({ q, limit, offset });
        res.json(products);
    } catch (error) {
        logger.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

export default router;
