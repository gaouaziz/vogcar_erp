const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/vehicles/categories (doit être avant /:id)
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicle_categories ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vehicles (liste complète avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT 
        v.*,
        c.name AS category_name,
        COALESCE(v.daily_rate, c.base_daily_rate) AS effective_daily_rate
      FROM vehicles v
      LEFT JOIN vehicle_categories c ON v.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND v.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (v.registration_number ILIKE $${params.length} OR v.brand ILIKE $${params.length} OR v.model ILIKE $${params.length})`;
    }

    query += ' ORDER BY v.id DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vehicles (Ajout d'un nouveau véhicule)
router.post('/', async (req, res) => {
  try {
    const {
      category_id,
      registration_number,
      brand,
      model,
      year,
      color,
      fuel_type,
      transmission,
      current_mileage,
      daily_rate,
      status,
    } = req.body;

    if (!registration_number || !brand || !model || !year) {
      return res.status(400).json({
        success: false,
        error: 'Plaque d\'immatriculation, marque, modèle et année sont obligatoires.',
      });
    }

    const insertQuery = `
      INSERT INTO vehicles (
        category_id, registration_number, brand, model, year,
        color, fuel_type, transmission, current_mileage, daily_rate, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const values = [
      category_id || null,
      registration_number.toUpperCase().trim(),
      brand.trim(),
      model.trim(),
      parseInt(year, 10),
      color || 'Blanc',
      fuel_type || 'PETROL',
      transmission || 'MANUAL',
      parseInt(current_mileage || 0, 10),
      daily_rate ? parseFloat(daily_rate) : null,
      status || 'AVAILABLE',
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Cette plaque d\'immatriculation existe déjà dans le système.',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/vehicles/:id/status (Changer rapidement le statut d'un véhicule)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['AVAILABLE', 'RENTED', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide.' });
    }

    const result = await pool.query(
      'UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Véhicule introuvable.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
