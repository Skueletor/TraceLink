const pool = require('../config/database');

class Movement {
  static async getAll(limit = 50) {
    const result = await pool.query(`
      SELECT m.*, 
             t.name as tool_name,
             w.name as worker_name,
             w.code as worker_code,
             b1.name as from_building,
             b2.name as to_building
      FROM movements m
      LEFT JOIN tools t ON m.tool_id = t.id
      LEFT JOIN workers w ON m.worker_id = w.id
      LEFT JOIN buildings b1 ON m.from_building_id = b1.id
      LEFT JOIN buildings b2 ON m.to_building_id = b2.id
      ORDER BY m.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  static async create(toolId, workerId, fromBuildingId, toBuildingId, movementType, description) {
    const result = await pool.query(
      `INSERT INTO movements (tool_id, worker_id, from_building_id, to_building_id, movement_type, action_description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [toolId, workerId, fromBuildingId, toBuildingId, movementType, description]
    );
    return result.rows[0];
  }

  static async assignTool(toolId, workerId, buildingId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE tool_assignments SET is_active = false, returned_at = CURRENT_TIMESTAMP WHERE tool_id = $1 AND is_active = true',
        [toolId]
      );

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

      await client.query(
        'UPDATE tool_assignments SET is_active = false, returned_at = CURRENT_TIMESTAMP WHERE tool_id = $1 AND is_active = true',
        [toolId]
      );

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
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Movement;