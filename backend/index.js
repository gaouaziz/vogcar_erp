const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes');

const app = express();

// Middlewares
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin && corsOrigin !== '*' ? corsOrigin.split(',') : '*',
  credentials: true,
}));

app.use(express.json());

// Routes API
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur API VogCar démarré sur le port ${PORT}`);
});
