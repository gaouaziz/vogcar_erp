const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/clients (Créer un nouveau client)
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      driving_license_number,
      city,
    } = req.body;

    if (!first_name || !last_name || !email || !phone || !driving_license_number) {
      return res.status(400).json({
        success: false,
        error: 'Nom, prénom, email, téléphone et numéro de permis sont obligatoires.',
      });
    }

    const insertQuery = `
      INSERT INTO clients (first_name, last_name, email, phone, driving_license_number, city)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      first_name.trim(),
      last_name.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      driving_license_number.toUpperCase().trim(),
      city || 'Paris',
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Un client avec cet email ou ce numéro de permis existe déjà.',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
