const pool = require('../config/database');

class Tool {
  static async getAll() {
    const result = await pool.query(`
      SELECT t.*, 
             w.name as worker_name, 
             w.code as worker_code,
             w.id as worker_id,
             b.name as building_name,
             b.id as building_id,
             ta.building_id as current_building_id
      FROM tools t
      LEFT JOIN tool_assignments ta ON t.id = ta.tool_id AND ta.is_active = true
      LEFT JOIN workers w ON ta.worker_id = w.id
      LEFT JOIN buildings b ON ta.building_id = b.id
      ORDER BY t.id
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM tools WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(name, code, category, maxTime) {
    try {
      const result = await pool.query(
        'INSERT INTO tools (name, code, category, max_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, code, category, maxTime, 'available']
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error en Tool.create:', error);
      throw error;
    }
  }

  static async update(id, name, code, category, maxTime) {
    try {
      // Validar que max_time no sea null o undefined
      if (!maxTime) {
        throw new Error('max_time es requerido y no puede ser null');
      }
      
      const result = await pool.query(
        'UPDATE tools SET name = $1, code = $2, category = $3, max_time = $4 WHERE id = $5 RETURNING *',
        [name, code, category, maxTime, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Herramienta no encontrada');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error en Tool.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    await pool.query('DELETE FROM tools WHERE id = $1', [id]);
  }
}

module.exports = Tool;