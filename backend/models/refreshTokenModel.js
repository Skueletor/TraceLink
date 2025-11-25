const pool = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class RefreshTokenModel {
  static async generate(userId, days = 7) {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const hash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const res = await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3) RETURNING id',
      [userId, hash, expiresAt]
    );
    return { id: res.rows[0].id, token: rawToken, expiresAt };
  }

  static async verifyAndConsume(rawToken, userId) {
    const res = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id=$1 AND revoked=false AND expires_at > NOW() ORDER BY created_at DESC',
      [userId]
    );
    for (const row of res.rows) {
      const match = await bcrypt.compare(rawToken, row.token_hash);
      if (match) {
        return row;
      }
    }
    return null;
  }

  static async revoke(rawToken, userId) {
    const res = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id=$1 AND revoked=false',
      [userId]
    );
    for (const row of res.rows) {
      const match = await bcrypt.compare(rawToken, row.token_hash);
      if (match) {
        await pool.query('UPDATE refresh_tokens SET revoked=true WHERE id=$1', [row.id]);
        return true;
      }
    }
    return false;
  }
}

module.exports = RefreshTokenModel;
