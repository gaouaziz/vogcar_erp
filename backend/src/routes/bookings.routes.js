const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        b.*,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        c.phone AS client_phone,
        c.email AS client_email,
        v.brand AS vehicle_brand,
        v.model AS vehicle_model,
        v.registration_number
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/bookings (Créer une nouvelle réservation)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { client_id, vehicle_id, start_date, end_date, notes } = req.body;

    if (!client_id || !vehicle_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Client, véhicule, date de début et date de fin sont obligatoires.',
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) {
      return res.status(400).json({
        success: false,
        error: 'La date de retour doit être postérieure à la date de départ.',
      });
    }

    // Calcul du nombre de jours
    const diffTime = Math.abs(end - start);
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    await client.query('BEGIN');

    // Récupérer le véhicule et son tarif
    const vehicleRes = await client.query(`
      SELECT v.*, COALESCE(v.daily_rate, c.base_daily_rate, 45.00) AS rate, COALESCE(c.deposit_amount, 500.00) AS deposit
      FROM vehicles v
      LEFT JOIN vehicle_categories c ON v.category_id = c.id
      WHERE v.id = $1
    `, [vehicle_id]);

    if (vehicleRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Véhicule introuvable.' });
    }

    const vehicle = vehicleRes.rows[0];
    const dailyRate = parseFloat(vehicle.rate);
    const subtotal = dailyRate * totalDays;
    const totalPrice = subtotal;
    const depositAmount = parseFloat(vehicle.deposit);

    // Générer une référence de réservation unique
    const countRes = await client.query('SELECT COUNT(*)::int AS count FROM bookings');
    const bookingNumber = String((countRes.rows[0].count || 0) + 1).padStart(4, '0');
    const bookingReference = `BK-${new Date().getFullYear()}-${bookingNumber}`;

    const insertBooking = `
      INSERT INTO bookings (
        booking_reference, client_id, vehicle_id,
        start_date, end_date, start_mileage,
        daily_rate, total_days, subtotal, total_price,
        deposit_amount, deposit_status, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'HELD', 'ACTIVE', $12)
      RETURNING *;
    `;

    const bookingRes = await client.query(insertBooking, [
      bookingReference,
      client_id,
      vehicle_id,
      start,
      end,
      vehicle.current_mileage || 0,
      dailyRate,
      totalDays,
      subtotal,
      totalPrice,
      depositAmount,
      notes || null,
    ]);

    // Mettre à jour le statut du véhicule en 'RENTED'
    await client.query(
      "UPDATE vehicles SET status = 'RENTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [vehicle_id]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: bookingRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur création réservation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// PATCH /api/bookings/:id/status (Mettre à jour le statut : ex COMPLETED, CANCELLED)
router.patch('/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, end_mileage } = req.body;

    const allowed = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut de réservation invalide.' });
    }

    await client.query('BEGIN');

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Réservation introuvable.' });
    }

    const booking = bookingRes.rows[0];

    const updateQuery = `
      UPDATE bookings 
      SET 
        status = $1, 
        end_mileage = COALESCE($2, end_mileage),
        actual_return_date = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE actual_return_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const updatedRes = await client.query(updateQuery, [status, end_mileage || null, id]);

    // Si la location est terminée ou annulée, libérer le véhicule
    if (['COMPLETED', 'CANCELLED'].includes(status)) {
      const vehicleUpdate = end_mileage
        ? 'UPDATE vehicles SET status = \'AVAILABLE\', current_mileage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'
        : 'UPDATE vehicles SET status = \'AVAILABLE\', updated_at = CURRENT_TIMESTAMP WHERE id = $1';
      
      const vehicleParams = end_mileage ? [end_mileage, booking.vehicle_id] : [booking.vehicle_id];
      await client.query(vehicleUpdate, vehicleParams);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: updatedRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
