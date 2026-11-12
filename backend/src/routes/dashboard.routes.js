const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // 1. Statistiques de la flotte automobile
    const vehicleStats = (await pool.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END)::int AS available,
        COUNT(CASE WHEN status = 'RENTED' THEN 1 END)::int AS rented,
        COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END)::int AS maintenance,
        COUNT(CASE WHEN status = 'RESERVED' THEN 1 END)::int AS reserved
      FROM vehicles;
    `)).rows[0] || { total: 0, available: 0, rented: 0, maintenance: 0, reserved: 0 };

    // 2. Statistiques réservations & chiffre d'affaires
    const bookingStats = (await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int AS active,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed,
        COALESCE(SUM(total_price), 0)::numeric(10,2) AS total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN total_price ELSE 0 END), 0)::numeric(10,2) AS monthly_revenue
      FROM bookings;
    `)).rows[0] || { active: 0, pending: 0, completed: 0, total_revenue: 0, monthly_revenue: 0 };

    // 3. Nombre de clients
    const clientStats = (await pool.query(`
      SELECT COUNT(*)::int AS total FROM clients;
    `)).rows[0] || { total: 0 };

    // 4. Dernières réservations avec détails client et véhicule
    const recentBookings = (await pool.query(`
      SELECT 
        b.id,
        b.booking_reference,
        b.start_date,
        b.end_date,
        b.total_price,
        b.deposit_amount,
        b.status,
        b.created_at,
        c.first_name AS client_first_name,
        c.last_name AS client_last_name,
        c.phone AS client_phone,
        v.brand AS vehicle_brand,
        v.model AS vehicle_model,
        v.registration_number
      FROM bookings b
      LEFT JOIN clients c ON b.client_id = c.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.created_at DESC
      LIMIT 6;
    `)).rows;

    res.json({
      success: true,
      data: {
        vehicles: vehicleStats,
        bookings: bookingStats,
        clients: clientStats,
        recentBookings,
      },
    });
  } catch (error) {
    console.error('Erreur API Dashboard Stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
