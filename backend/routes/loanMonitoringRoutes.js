const express = require('express');
const router = express.Router();
const loanMonitoringController = require('../controllers/loanMonitoringController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Rutas protegidas - requieren autenticación
router.use(authenticate);

// Dashboard completo (administradores y usuarios)
router.get('/dashboard', loanMonitoringController.getDashboard);

// Préstamos activos
router.get('/loans', loanMonitoringController.getActiveLoans);
router.get('/loans/worker/:workerId', loanMonitoringController.getLoansByWorker);
router.get('/loans/assignment/:assignmentId', loanMonitoringController.getLoanDetails);
router.get('/loans/upcoming-due', loanMonitoringController.getUpcomingDue);

// Alertas (solo administradores)
router.get('/alerts', adminOnly, loanMonitoringController.getActiveAlerts);
router.get('/alerts/all', adminOnly, loanMonitoringController.getAllAlerts);
router.post('/alerts/generate', adminOnly, loanMonitoringController.generateAlerts);
router.put('/alerts/:id/resolve', adminOnly, loanMonitoringController.resolveAlert);

// Estadísticas (solo administradores)
router.get('/stats', adminOnly, loanMonitoringController.getSystemStats);

module.exports = router;