import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

export async function listDoctors(req, res, next) {
  try {
    const rows = await query(
      `SELECT d.id, d.specialty, d.bio, d.consultation_fee, d.color,
              u.id AS user_id, u.name, u.email, u.phone, u.is_active
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       ORDER BY u.name`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getDoctor(req, res, next) {
  try {
    const rows = await query(
      `SELECT d.id, d.specialty, d.bio, d.consultation_fee, d.color,
              u.id AS user_id, u.name, u.email, u.phone, u.is_active
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    const schedules = await query(
      'SELECT id, day_of_week, start_time, end_time, slot_minutes FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week, start_time',
      [req.params.id]
    );
    res.json({ doctor: rows[0], schedules });
  } catch (err) {
    next(err);
  }
}

export async function createDoctor(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, email, password, phone, specialty, bio, consultation_fee, color } = req.body;
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await conn.execute(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'doctor', ?)`,
      [name, email, hash, phone || null]
    );
    const [docResult] = await conn.execute(
      'INSERT INTO doctors (user_id, specialty, bio, consultation_fee, color) VALUES (?, ?, ?, ?, ?)',
      [userResult.insertId, specialty, bio || null, consultation_fee || 0, color || '#0d9488']
    );
    await conn.commit();
    res.status(201).json({ id: docResult.insertId, message: 'Doctor created' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(err);
  } finally {
    conn.release();
  }
}

export async function updateDoctor(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, phone, specialty, bio, consultation_fee, color, is_active } = req.body;
    const rows = await query('SELECT user_id FROM doctors WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    await conn.beginTransaction();
    await conn.execute(
      'UPDATE users SET name = ?, phone = ?, is_active = ? WHERE id = ?',
      [name, phone || null, is_active ?? 1, rows[0].user_id]
    );
    await conn.execute(
      'UPDATE doctors SET specialty = ?, bio = ?, consultation_fee = ?, color = ? WHERE id = ?',
      [specialty, bio || null, consultation_fee || 0, color || '#0d9488', req.params.id]
    );
    await conn.commit();
    res.json({ message: 'Doctor updated' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/** Replace a doctor's full weekly schedule in one call. */
export async function updateSchedule(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { schedules } = req.body; // [{ day_of_week, start_time, end_time, slot_minutes }]
    await conn.beginTransaction();
    await conn.execute('DELETE FROM doctor_schedules WHERE doctor_id = ?', [req.params.id]);
    for (const s of schedules) {
      await conn.execute(
        'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, s.day_of_week, s.start_time, s.end_time, s.slot_minutes || 30]
      );
    }
    await conn.commit();
    res.json({ message: 'Schedule updated' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}
