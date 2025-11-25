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
    const result = await pool.query(
      'INSERT INTO tools (name, code, category, max_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, category, maxTime]
    );
    return result.rows[0];
  }

  static async update(id, name, code, category, maxTime) {
    const result = await pool.query(
      'UPDATE tools SET name = $1, code = $2, category = $3, max_time = $4 WHERE id = $5 RETURNING *',
      [name, code, category, maxTime, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM tools WHERE id = $1', [id]);
  }
}

module.exports = Tool;