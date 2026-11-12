const express = require('express');
const router = express.Router();

const statusRoutes = require('./status.routes');
const dashboardRoutes = require('./dashboard.routes');
const vehiclesRoutes = require('./vehicles.routes');
const clientsRoutes = require('./clients.routes');
const bookingsRoutes = require('./bookings.routes');

// Enregistrement des routes modulaires
router.use('/', statusRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/clients', clientsRoutes);
router.use('/bookings', bookingsRoutes);

module.exports = router;
