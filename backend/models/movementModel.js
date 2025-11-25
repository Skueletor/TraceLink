const pool = require('../config/database');

class Movement {
  static async getAll(limit = 50) {
    const result = await pool.query(`
      SELECT m.*, 
             t.name as tool_name,
             w.name as worker_name,
             w.code as worker_code,
             b1.name as from_building,
             b2.name as to_building,
             u.name as user_name
      FROM movements m
      LEFT JOIN tools t ON m.tool_id = t.id
      LEFT JOIN workers w ON m.worker_id = w.id
      LEFT JOIN buildings b1 ON m.from_building_id = b1.id
      LEFT JOIN buildings b2 ON m.to_building_id = b2.id
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  static async create(toolId, workerId, fromBuildingId, toBuildingId, movementType, description, userId = null) {
    const result = await pool.query(
      `INSERT INTO movements (tool_id, worker_id, from_building_id, to_building_id, movement_type, action_description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [toolId, workerId, fromBuildingId, toBuildingId, movementType, description, userId]
    );
    return result.rows[0];
  }

  static async assignTool(toolId, workerId, buildingId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si el trabajador ya tiene una herramienta activa
      const existingTool = await client.query(
        `SELECT ta.id, t.name as tool_name, b.name as building_name 
         FROM tool_assignments ta 
         JOIN tools t ON ta.tool_id = t.id 
         JOIN buildings b ON ta.building_id = b.id 
         WHERE ta.worker_id = $1 AND ta.is_active = true`,
        [workerId]
      );

      if (existingTool.rows.length > 0) {
        const activeTool = existingTool.rows[0];
        throw new Error(`El trabajador ya tiene asignada la herramienta "${activeTool.tool_name}" en ${activeTool.building_name}. Debe devolver la herramienta actual antes de tomar otra.`);
      }

      // Desactivar asignación actual de la herramienta (por si estaba asignada a otro trabajador)
      await client.query(
        'UPDATE tool_assignments SET is_active = false, returned_at = CURRENT_TIMESTAMP WHERE tool_id = $1 AND is_active = true',
        [toolId]
      );

      // Asignar herramienta al trabajador
      await client.query(
        'INSERT INTO tool_assignments (tool_id, worker_id, building_id) VALUES ($1, $2, $3)',
        [toolId, workerId, buildingId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async transferTool(toolId, toBuildingId) {
    await pool.query(
      'UPDATE tool_assignments SET building_id = $2 WHERE tool_id = $1 AND is_active = true',
      [toolId, toBuildingId]
    );
  }

  static async returnTool(toolId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener la asignación actual antes de desactivarla (para resolver alertas)
      const currentAssignment = await client.query(
        'SELECT id FROM tool_assignments WHERE tool_id = $1 AND is_active = true',
        [toolId]
      );

      await client.query(
        'UPDATE tool_assignments SET is_active = false, returned_at = CURRENT_TIMESTAMP WHERE tool_id = $1 AND is_active = true',
        [toolId]
      );

      // Resolver alertas asociadas a esta asignación
      if (currentAssignment.rows.length > 0) {
        await client.query(
          'SELECT resolve_loan_alerts_for_assignment($1)',
          [currentAssignment.rows[0].id]
        );
      }

      // Re-asignar al almacén (buscar por descripción "Almacén")
      const almacResult = await client.query(
        "SELECT id FROM buildings WHERE description = 'Almacén' LIMIT 1"
      );
      const almacenId = almacResult.rows[0]?.id || 3; // fallback a 3 si no existe

      await client.query(
        'INSERT INTO tool_assignments (tool_id, building_id, is_active) VALUES ($1, $2, true)',
        [toolId, almacenId]
      );

      await client.query('COMMIT');
      
      console.log(`✅ Herramienta ${toolId} devuelta al almacén. Alertas resueltas automáticamente.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getWorkerActiveTool(workerId) {
    const result = await pool.query(
      `SELECT ta.tool_id, t.name as tool_name, t.code as tool_code, 
              b.name as building_name, b.id as building_id, ta.assigned_at
       FROM tool_assignments ta 
       JOIN tools t ON ta.tool_id = t.id 
       JOIN buildings b ON ta.building_id = b.id 
       WHERE ta.worker_id = $1 AND ta.is_active = true`,
      [workerId]
    );
    return result.rows[0] || null;
  }

  static async checkWorkerHasActiveTool(workerId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM tool_assignments WHERE worker_id = $1 AND is_active = true',
      [workerId]
    );
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = Movement;