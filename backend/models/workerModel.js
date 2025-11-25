const pool = require('../config/database');

class Worker {
  static async getAll() {
    const result = await pool.query('SELECT * FROM workers ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM workers WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(name, code, role, area) {
    const result = await pool.query(
      'INSERT INTO workers (name, code, role, area) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, role, area]
    );
    return result.rows[0];
  }

  static async update(id, name, code, role, area) {
    const result = await pool.query(
      'UPDATE workers SET name = $1, code = $2, role = $3, area = $4 WHERE id = $5 RETURNING *',
      [name, code, role, area, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM workers WHERE id = $1', [id]);
  }
}

module.exports = Worker;