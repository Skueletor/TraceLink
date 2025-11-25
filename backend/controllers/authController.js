const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const RefreshTokenModel = require('../models/refreshTokenModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ sub: user.id, role: user.role_name }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    const days = Number(process.env.REFRESH_EXPIRY_DAYS) || 7;
    const refresh = await RefreshTokenModel.generate(user.id, days);
    res.json({ 
      token, 
      refreshToken: refresh.token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role_name },
      refreshExpiresAt: refresh.expiresAt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'user', workerId = null } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password requeridos' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, rounds);
    const newUser = await User.create({ name, email, passwordHash, roleName: role, workerId });
    res.status(201).json(newUser);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken, userId } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });
    // userId optional: decode from existing access maybe, but we ask explicit user id or do a lookup.
    // Simpler: iterate all tokens for all users is expensive; require userId
    const uid = userId || req.user?.id;
    if (!uid) return res.status(400).json({ error: 'userId requerido' });
    const rt = await RefreshTokenModel.verifyAndConsume(refreshToken, uid);
    if (!rt) return res.status(401).json({ error: 'Refresh inválido' });
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const token = jwt.sign({ sub: user.id, role: user.role_name }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken, userId } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });
    const uid = userId || req.user?.id;
    if (!uid) return res.status(400).json({ error: 'userId requerido' });
    const revoked = await RefreshTokenModel.revoke(refreshToken, uid);
    res.json({ revoked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let updatedUser = null;
    if (name) {
      updatedUser = await User.updateBasic(user.id, name);
    }
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'currentPassword requerido para cambio de contraseña' });
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
      const newHash = await bcrypt.hash(newPassword, rounds);
      await User.updatePassword(user.id, newHash);
      if (!updatedUser) updatedUser = await User.findById(user.id);
    }
    if (!updatedUser) updatedUser = user;
    res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
