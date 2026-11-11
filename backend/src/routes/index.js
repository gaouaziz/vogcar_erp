const express = require('express');
const router = express.Router();
const statusRoutes = require('./status.routes');

// Enregistrement des routes modulaires
router.use('/', statusRoutes);

module.exports = router;
