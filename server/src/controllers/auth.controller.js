import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    console.log('[v0-auth] login attempt:', email);
    const rows = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    console.log('[v0-auth] query returned', rows.length, 'rows');
    const user = rows[0];
    if (!user) {
      console.log('[v0-auth] user not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.is_active) {
      console.log('[v0-auth] user inactive');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const pwMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[v0-auth] password match:', pwMatch);
    if (!pwMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
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
      'SELECT id, name, email, role, phone, avatar FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}
