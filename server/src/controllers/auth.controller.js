import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { auditFromReq } from '../utils/audit.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const rows = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
    auditFromReq(req, 'auth.login', 'user', user.id, { email: user.email });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const rows = await query(
      'SELECT id, name, email, role, phone, avatar FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** Change the logged-in user's own password. */
export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (new_password.length < 8) {
      return res.status(422).json({ message: 'New password must be at least 8 characters' });
    }
    const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}
