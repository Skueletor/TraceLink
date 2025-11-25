const express = require('express');
const cors = require('cors');
require('dotenv').config();

const buildingRoutes = require('./routes/buildingRoutes');
const workerRoutes = require('./routes/workerRoutes');
const toolRoutes = require('./routes/toolRoutes');
const movementRoutes = require('./routes/movementRoutes');
const authRoutes = require('./routes/authRoutes');
const loanMonitoringRoutes = require('./routes/loanMonitoringRoutes');
const { authenticate, adminOnly } = require('./middleware/authMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
// Auth public
app.use('/api/auth', authRoutes);

// Protected (admin only por ahora)
app.use('/api/buildings', authenticate, adminOnly, buildingRoutes);
app.use('/api/workers', authenticate, adminOnly, workerRoutes);
app.use('/api/tools', authenticate, adminOnly, toolRoutes);
app.use('/api/movements', authenticate, adminOnly, movementRoutes);
app.use('/api/monitoring', loanMonitoringRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: '🚀 TraceLink API funcionando correctamente' });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});