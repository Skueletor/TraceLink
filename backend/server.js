const express = require('express');
const cors = require('cors');
require('dotenv').config();

const buildingRoutes = require('./routes/buildingRoutes');
const workerRoutes = require('./routes/workerRoutes');
const toolRoutes = require('./routes/toolRoutes');
const movementRoutes = require('./routes/movementRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/buildings', buildingRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/movements', movementRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: '🚀 TraceLink API funcionando correctamente' });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});