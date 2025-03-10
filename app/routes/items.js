const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiter spécifique pour les opérations sensibles
const createUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30 // limite à 30 requêtes par fenêtre
});

// Validation des entrées
const validateItem = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .escape()
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .escape()
        .withMessage('La description doit contenir entre 10 et 1000 caractères'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Le prix doit être un nombre positif')
];

// Middleware de validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }
    next();
};

// GET tous les items
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM items');
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des items:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des items'
        });
    }
});

// GET un item par ID
router.get('/:id', 
    param('id').isInt().withMessage('ID invalide'),
    validate,
    async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Item non trouvé'
                });
            }
            res.json({
                status: 'success',
                data: rows[0]
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'item:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération de l\'item'
            });
        }
    }
);

// POST nouvel item
router.post('/',
    createUpdateLimiter,
    validateItem,
    validate,
    async (req, res) => {
        try {
            const { name, description, price } = req.body;
            const [result] = await pool.query(
                'INSERT INTO items (name, description, price) VALUES (?, ?, ?)',
                [name, description, price]
            );
            res.status(201).json({
                status: 'success',
                data: {
                    id: result.insertId,
                    name,
                    description,
                    price
                }
            });
        } catch (error) {
            logger.error('Erreur lors de la création de l\'item:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la création de l\'item'
            });
        }
    }
);

// PUT mise à jour d'un item
router.put('/:id',
    createUpdateLimiter,
    param('id').isInt().withMessage('ID invalide'),
    validateItem,
    validate,
    async (req, res) => {
        try {
            const { name, description, price } = req.body;
            const [result] = await pool.query(
                'UPDATE items SET name = ?, description = ?, price = ? WHERE id = ?',
                [name, description, price, req.params.id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Item non trouvé'
                });
            }
            res.json({
                status: 'success',
                data: {
                    id: req.params.id,
                    name,
                    description,
                    price
                }
            });
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de l\'item:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la mise à jour de l\'item'
            });
        }
    }
);

// DELETE suppression d'un item
router.delete('/:id',
    createUpdateLimiter,
    param('id').isInt().withMessage('ID invalide'),
    validate,
    async (req, res) => {
        try {
            const [result] = await pool.query('DELETE FROM items WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Item non trouvé'
                });
            }
            res.json({
                status: 'success',
                message: 'Item supprimé avec succès'
            });
        } catch (error) {
            logger.error('Erreur lors de la suppression de l\'item:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la suppression de l\'item'
            });
        }
    }
);

module.exports = router;
