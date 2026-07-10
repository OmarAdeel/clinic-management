import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

/** List all users. */
export async function listUsers(req, res, next) {
  try {
    const search = (req.query.search || '').trim();
    const where = search ? 'WHERE name ILIKE ? OR email ILIKE ? OR phone ILIKE ?' : '';
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const rows = await query(
      `SELECT id, name, email, role, phone, is_active, avatar, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC`,
      params
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/** Create a new user. */
export async function createUser(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email address already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();

    // Insert user
    const [userRes] = await conn.execute(
      `INSERT INTO users (name, email, password_hash, role, phone, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [name, email, passwordHash, role, phone || null]
    );
    const userId = userRes.insertId;

    // If role is doctor, automatically create the doctor configuration profile
    if (role === 'doctor') {
      await conn.execute(
        `INSERT INTO doctors (user_id, specialty, bio, consultation_fee, color)
         VALUES (?, 'General Medicine', 'General practitioner.', 50.00, '#0d9488')`,
        [userId]
      );
    }

    await conn.commit();
    res.status(201).json({ id: userId, message: 'User created successfully' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/** Update an existing user. */
export async function updateUser(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, email, password, role, phone, is_active } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const users = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    const oldRole = users[0].role;

    // Check if email is already taken by another user
    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing.length) {
        return res.status(409).json({ message: 'Email address already in use' });
      }
    }

    await conn.beginTransaction();

    // Update basic info
    await conn.execute(
      `UPDATE users 
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, email, phone, role, is_active, userId]
    );

    // Update password if provided
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    }

    // Role progression logic:
    // If role changed to doctor, ensure there is a doctor profile
    const newRole = role || oldRole;
    if (newRole === 'doctor' && oldRole !== 'doctor') {
      const docCheck = await query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
      if (!docCheck.length) {
        await conn.execute(
          `INSERT INTO doctors (user_id, specialty, bio, consultation_fee, color)
           VALUES (?, 'General Medicine', 'General practitioner.', 50.00, '#0d9488')`,
          [userId]
        );
      }
    }

    await conn.commit();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/** Delete a user. */
export async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;
    // Check if user exists
    const users = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves (self-deletion block)
    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}
