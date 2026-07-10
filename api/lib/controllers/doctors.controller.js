import bcrypt from 'bcryptjs';
import { transaction, query } from '../config/db.js';

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
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    const schedules = await query(
      'SELECT id, day_of_week, start_time, end_time, slot_minutes FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week, start_time',
      [req.params.id]
    );
    res.json({ doctor: rows[0], schedules });
  } catch (err) {
    next(err);
  }
}

export async function createDoctor(req, res, next) {
  try {
    const { name, email, password, phone, specialty, bio, consultation_fee, color } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const result = await transaction(async (q) => {
      const userRows = await q(
        `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, 'doctor', $4) RETURNING id`,
        [name, email, hash, phone || null]
      );
      const docRows = await q(
        'INSERT INTO doctors (user_id, specialty, bio, consultation_fee, color) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userRows[0].id, specialty, bio || null, consultation_fee || 0, color || '#0d9488']
      );
      return docRows[0].id;
    });

    res.status(201).json({ id: result, message: 'Doctor created' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(err);
  }
}

export async function updateDoctor(req, res, next) {
  try {
    const { name, phone, specialty, bio, consultation_fee, color, is_active } = req.body;
    const rows = await query('SELECT user_id FROM doctors WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Doctor not found' });

    await transaction(async (q) => {
      await q(
        'UPDATE users SET name = $1, phone = $2, is_active = $3 WHERE id = $4',
        [name, phone || null, is_active ?? true, rows[0].user_id]
      );
      await q(
        'UPDATE doctors SET specialty = $1, bio = $2, consultation_fee = $3, color = $4 WHERE id = $5',
        [specialty, bio || null, consultation_fee || 0, color || '#0d9488', req.params.id]
      );
    });

    res.json({ message: 'Doctor updated' });
  } catch (err) {
    next(err);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const { schedules } = req.body;

    await transaction(async (q) => {
      await q('DELETE FROM doctor_schedules WHERE doctor_id = $1', [req.params.id]);
      for (const s of schedules) {
        await q(
          'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes) VALUES ($1, $2, $3, $4, $5)',
          [req.params.id, s.day_of_week, s.start_time, s.end_time, s.slot_minutes || 30]
        );
      }
    });

    res.json({ message: 'Schedule updated' });
  } catch (err) {
    next(err);
  }
}
