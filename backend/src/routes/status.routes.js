const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Route de test & statut pour l'API et la base de données
router.get('/status', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Le serveur Express fonctionne !',
      environment: process.env.NODE_ENV || 'development',
      db_time: dbTest.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

module.exports = router;
