const pool = require('../config/database');

class LoanMonitoringModel {
  // Obtener todos los préstamos activos con información de tiempo
  static async getActiveLoansWithTimeInfo() {
    const result = await pool.query('SELECT * FROM get_active_loans_with_time_info()');
    return result.rows;
  }

  // Obtener préstamos por estado (active, warning, overdue)
  static async getLoansByStatus(status = null) {
    let query = 'SELECT * FROM get_active_loans_with_time_info()';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY assigned_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Generar alertas automáticamente
  static async generateAlerts() {
    const result = await pool.query('SELECT generate_loan_alerts() as alerts_created');
    return result.rows[0].alerts_created;
  }

  // Obtener alertas activas
  static async getActiveAlerts() {
    const result = await pool.query(`
      SELECT 
        la.*,
        t.name as tool_name,
        t.code as tool_code,
        w.name as worker_name,
        w.code as worker_code,
        b.name as building_name,
        EXTRACT(EPOCH FROM la.time_overdue)/60 as overdue_minutes
      FROM loan_alerts la
      JOIN tools t ON la.tool_id = t.id
      JOIN workers w ON la.worker_id = w.id
      JOIN tool_assignments ta ON la.tool_assignment_id = ta.id
      JOIN buildings b ON ta.building_id = b.id
      WHERE la.is_resolved = false
      ORDER BY la.created_at DESC
    `);
    return result.rows;
  }

  // Obtener todas las alertas (historial)
  static async getAllAlerts(limit = 50) {
    const result = await pool.query(`
      SELECT 
        la.*,
        t.name as tool_name,
        t.code as tool_code,
        w.name as worker_name,
        w.code as worker_code,
        b.name as building_name,
        EXTRACT(EPOCH FROM la.time_overdue)/60 as overdue_minutes
      FROM loan_alerts la
      JOIN tools t ON la.tool_id = t.id
      JOIN workers w ON la.worker_id = w.id
      JOIN tool_assignments ta ON la.tool_assignment_id = ta.id
      JOIN buildings b ON ta.building_id = b.id
      ORDER BY la.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  // Resolver alerta manualmente
  static async resolveAlert(alertId) {
    const result = await pool.query(
      'UPDATE loan_alerts SET is_resolved = true, resolved_at = NOW() WHERE id = $1 RETURNING *',
      [alertId]
    );
    return result.rows[0];
  }

  // Resolver todas las alertas de una asignación específica
  static async resolveAlertsForAssignment(assignmentId) {
    const result = await pool.query('SELECT resolve_loan_alerts_for_assignment($1) as resolved_count', [assignmentId]);
    return result.rows[0].resolved_count;
  }

  // Obtener estadísticas del sistema
  static async getSystemStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_loans,
        COUNT(*) FILTER (WHERE status = 'warning') as warning_loans,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_loans,
        AVG(time_elapsed_minutes) as avg_loan_duration,
        COUNT(*) as total_active_loans
      FROM get_active_loans_with_time_info()
    `;
    
    const alertsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE is_resolved = false) as active_alerts,
        COUNT(*) FILTER (WHERE alert_type = 'critical' AND is_resolved = false) as critical_alerts,
        COUNT(*) as total_alerts
      FROM loan_alerts
    `;
    
    const [statsResult, alertsResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(alertsQuery)
    ]);
    
    return {
      loans: statsResult.rows[0],
      alerts: alertsResult.rows[0]
    };
  }

  // Obtener información detallada de un préstamo específico
  static async getLoanDetails(assignmentId) {
    const result = await pool.query(`
      SELECT * FROM get_active_loans_with_time_info() 
      WHERE assignment_id = $1
    `, [assignmentId]);
    
    if (result.rows.length === 0) return null;
    
    const loan = result.rows[0];
    
    // Obtener alertas asociadas
    const alertsResult = await pool.query(`
      SELECT * FROM loan_alerts 
      WHERE tool_assignment_id = $1 
      ORDER BY created_at DESC
    `, [assignmentId]);
    
    return {
      ...loan,
      alerts: alertsResult.rows
    };
  }

  // Obtener préstamos por trabajador específico
  static async getLoansByWorker(workerId) {
    const result = await pool.query(`
      SELECT * FROM get_active_loans_with_time_info() 
      WHERE worker_id = $1
    `, [workerId]);
    return result.rows;
  }

  // Obtener préstamos que están próximos a vencer (últimos 30 minutos)
  static async getUpcomingDue(minutesThreshold = 30) {
    const result = await pool.query(`
      SELECT * FROM get_active_loans_with_time_info() 
      WHERE time_remaining_minutes > 0 
      AND time_remaining_minutes <= $1 
      AND status = 'warning'
      ORDER BY time_remaining_minutes ASC
    `, [minutesThreshold]);
    return result.rows;
  }
}

module.exports = LoanMonitoringModel;