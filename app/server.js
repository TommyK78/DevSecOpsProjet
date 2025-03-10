const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const mysql = require('mysql2/promise');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration du logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Configuration de l'application
const app = express();
const port = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost',
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'votre_secret_temporaire',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 heure
    }
}));

// Protection CSRF
app.use(csrf({ cookie: true }));

// Configuration de la base de données
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'backend',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'app_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Middleware de validation pour les items
const validateItem = [
    body('name').trim().isLength({ min: 1, max: 100 }).escape(),
    body('description').trim().isLength({ min: 1, max: 500 }).escape()
];

// CRUD Routes
app.post('/api/items', validateItem, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO items (name, description) VALUES (?, ?)',
            [name, description]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            description
        });
    } catch (error) {
        logger.error('Erreur lors de la création:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM items');
        res.json(rows);
    } catch (error) {
        logger.error('Erreur lors de la lecture:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.put('/api/items/:id', validateItem, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description } = req.body;
        const [result] = await pool.execute(
            'UPDATE items SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item non trouvé' });
        }

        res.json({ id: req.params.id, name, description });
    } catch (error) {
        logger.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM items WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item non trouvé' });
        }

        res.status(204).send();
    } catch (error) {
        logger.error('Erreur lors de la suppression:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    logger.error('Erreur non gérée:', err);
    res.status(500).json({ error: 'Erreur serveur' });
});

// Démarrage du serveur
app.listen(port, () => {
    logger.info(`Serveur démarré sur le port ${port}`);
    console.log(`Serveur démarré sur le port ${port}`);
});
