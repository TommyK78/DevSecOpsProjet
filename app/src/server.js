const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'backend',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'devsecops'
};

// Pool de connexions
const pool = mysql.createPool(dbConfig);

// Routes CRUD
app.post('/items', [
  body('name').trim().isLength({ min: 1 }).escape(),
  body('description').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const conn = await pool.getConnection();
    await conn.execute('INSERT INTO items (name, description) VALUES (?, ?)', [name, description]);
    conn.release();
    res.status(201).json({ message: 'Item créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/items', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM items');
    conn.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/items/:id', [
  body('name').trim().isLength({ min: 1 }).escape(),
  body('description').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const { id } = req.params;
    const conn = await pool.getConnection();
    await conn.execute('UPDATE items SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    conn.release();
    res.json({ message: 'Item mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM items WHERE id = ?', [id]);
    conn.release();
    res.json({ message: 'Item supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Page d'accueil simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Application CRUD</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .form-group { margin-bottom: 15px; }
          input, textarea { width: 100%; padding: 8px; margin-top: 5px; }
          button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
          #items { margin-top: 20px; }
          .item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Application CRUD</h1>
        
        <div class="form-group">
          <h2>Ajouter un item</h2>
          <input type="text" id="name" placeholder="Nom" required>
          <textarea id="description" placeholder="Description"></textarea>
          <button onclick="createItem()">Ajouter</button>
        </div>

        <div id="items"></div>

        <script>
          // Charger les items
          async function loadItems() {
            const response = await fetch('/items');
            const items = await response.json();
            const container = document.getElementById('items');
            container.innerHTML = items.map(item => 
              '<div class="item">' +
              '<h3>' + item.name + '</h3>' +
              '<p>' + item.description + '</p>' +
              '<button onclick="deleteItem(' + item.id + ')">Supprimer</button>' +
              '</div>'
            ).join('');
          }

          // Créer un item
          async function createItem() {
            const name = document.getElementById('name').value;
            const description = document.getElementById('description').value;
            
            await fetch('/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, description })
            });
            
            loadItems();
            document.getElementById('name').value = '';
            document.getElementById('description').value = '';
          }

          // Supprimer un item
          async function deleteItem(id) {
            await fetch('/items/' + id, { method: 'DELETE' });
            loadItems();
          }

          // Charger les items au démarrage
          loadItems();
        </script>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Serveur démarré sur le port ' + port);
});
