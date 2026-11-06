const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

// Route de test pour l'API
app.get('/api/status', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      message: 'Le serveur Express fonctionne !', 
      db_time: dbTest.rows[0].now 
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur API VogCar démarré sur le port ${PORT}`);
});
