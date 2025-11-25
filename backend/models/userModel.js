const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const res = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE lower(email)=lower($1) LIMIT 1`,
      [email]
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id=$1 LIMIT 1`,
      [id]
    );
    return res.rows[0];
  }

  static async create({ name, email, passwordHash, roleName = 'user', workerId = null }) {
    const roleRes = await pool.query('SELECT id FROM roles WHERE name=$1', [roleName]);
    const roleId = roleRes.rows[0]?.id || null;
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, worker_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role_id`,
      [name, email, passwordHash, roleId, workerId]
    );
    return res.rows[0];
  }

  static async updateBasic(id, name) {
    const res = await pool.query(
      `UPDATE users SET name=$2, updated_at=NOW() WHERE id=$1 RETURNING id, name, email`,
      [id, name]
    );
    return res.rows[0];
  }

  static async updatePassword(id, newHash) {
    await pool.query(`UPDATE users SET password_hash=$2, updated_at=NOW() WHERE id=$1`, [id, newHash]);
    return true;
  }
}

module.exports = User;
