const pool = require('../config/database');

class Building {
  static async getAll() {
    const result = await pool.query('SELECT * FROM buildings ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);
    return result.rows[0];
  }
}

module.exports = Building;