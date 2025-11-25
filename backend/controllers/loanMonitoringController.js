const LoanMonitoringModel = require('../models/loanMonitoringModel');

// Obtener todos los préstamos activos con información de tiempo
exports.getActiveLoans = async (req, res) => {
  try {
    const { status } = req.query;
    const loans = await LoanMonitoringModel.getLoansByStatus(status);
    res.json(loans);
  } catch (error) {
    console.error('Error obteniendo préstamos activos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generar alertas automáticamente
exports.generateAlerts = async (req, res) => {
  try {
    console.log('🔔 Generando alertas automáticas...');
    const alertsCreated = await LoanMonitoringModel.generateAlerts();
    console.log(`✅ ${alertsCreated} nuevas alertas generadas`);
    res.json({ 
      success: true, 
      alertsCreated,
      message: `${alertsCreated} nuevas alertas generadas` 
    });
  } catch (error) {
    console.error('Error generando alertas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener alertas activas (no resueltas)
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await LoanMonitoringModel.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error obteniendo alertas activas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las alertas (historial)
exports.getAllAlerts = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const alerts = await LoanMonitoringModel.getAllAlerts(parseInt(limit));
    res.json(alerts);
  } catch (error) {
    console.error('Error obteniendo historial de alertas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Resolver una alerta específica
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedAlert = await LoanMonitoringModel.resolveAlert(id);
    
    if (!resolvedAlert) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    console.log(`✅ Alerta ${id} resuelta manualmente`);
    res.json({ 
      success: true, 
      alert: resolvedAlert,
      message: 'Alerta resuelta correctamente' 
    });
  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas del sistema
exports.getSystemStats = async (req, res) => {
  try {
    const stats = await LoanMonitoringModel.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener detalles de un préstamo específico
exports.getLoanDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const loanDetails = await LoanMonitoringModel.getLoanDetails(assignmentId);
    
    if (!loanDetails) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    res.json(loanDetails);
  } catch (error) {
    console.error('Error obteniendo detalles del préstamo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener préstamos por trabajador
exports.getLoansByWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const loans = await LoanMonitoringModel.getLoansByWorker(workerId);
    res.json(loans);
  } catch (error) {
    console.error('Error obteniendo préstamos por trabajador:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener préstamos próximos a vencer
exports.getUpcomingDue = async (req, res) => {
  try {
    const { minutes = 30 } = req.query;
    const upcomingLoans = await LoanMonitoringModel.getUpcomingDue(parseInt(minutes));
    res.json(upcomingLoans);
  } catch (error) {
    console.error('Error obteniendo préstamos próximos a vencer:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dashboard completo con toda la información
exports.getDashboard = async (req, res) => {
  try {
    console.log('📊 Obteniendo dashboard de monitoreo...');
    
    // Generar alertas automáticamente antes de obtener datos
    await LoanMonitoringModel.generateAlerts();
    
    const [
      activeLoans,
      activeAlerts,
      stats,
      upcomingDue
    ] = await Promise.all([
      LoanMonitoringModel.getActiveLoansWithTimeInfo(),
      LoanMonitoringModel.getActiveAlerts(),
      LoanMonitoringModel.getSystemStats(),
      LoanMonitoringModel.getUpcomingDue(30)
    ]);
    
    // Categorizar préstamos por estado
    const loansByStatus = {
      active: activeLoans.filter(loan => loan.status === 'active'),
      warning: activeLoans.filter(loan => loan.status === 'warning'),
      overdue: activeLoans.filter(loan => loan.status === 'overdue')
    };
    
    res.json({
      loans: {
        all: activeLoans,
        byStatus: loansByStatus,
        upcomingDue
      },
      alerts: {
        active: activeAlerts,
        count: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.alert_type === 'critical').length,
          overdue: activeAlerts.filter(a => a.alert_type === 'overdue').length
        }
      },
      stats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ error: error.message });
  }
};