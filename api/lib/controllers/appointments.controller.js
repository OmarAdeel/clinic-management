import { query } from '../config/db.js';
import { getPagination, timeToMinutes, minutesToTime } from '../utils/helpers.js';

const BASE_SELECT = `
  SELECT a.id, a.date, a.start_time, a.end_time, a.status, a.reason,
         a.patient_id, p.full_name AS patient_name, p.phone AS patient_phone,
         a.doctor_id, du.name AS doctor_name, d.specialty, d.color AS doctor_color
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
  JOIN users du ON du.id = d.user_id`;

export async function listAppointments(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req, 20);
    const clauses = [];
    const params = [];
    let idx = 1;

    if (req.query.from)       { clauses.push(`a.date >= $${idx++}`);       params.push(req.query.from); }
    if (req.query.to)         { clauses.push(`a.date <= $${idx++}`);       params.push(req.query.to); }
    if (req.query.doctor_id)  { clauses.push(`a.doctor_id = $${idx++}`);   params.push(req.query.doctor_id); }
    if (req.query.patient_id) { clauses.push(`a.patient_id = $${idx++}`);  params.push(req.query.patient_id); }
    if (req.query.status)     { clauses.push(`a.status = $${idx++}`);      params.push(req.query.status); }
    if (req.user.role === 'doctor') {
      clauses.push(`du.id = $${idx++}`);
      params.push(req.user.id);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const [countRows, rows] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id ${where}`,
        params
      ),
      query(
        `${BASE_SELECT} ${where} ORDER BY a.date DESC, a.start_time DESC LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
    ]);
    res.json({ data: rows, total: Number(countRows[0].total), page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const rows = await query(`${BASE_SELECT} WHERE a.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });

    const appointment = rows[0];
    const visitRows = await query('SELECT * FROM visits WHERE appointment_id = $1', [appointment.id]);
    let visit = visitRows[0] || null;
    if (visit) {
      visit.prescriptions = await query(
        'SELECT id, medication, dosage, frequency, duration, instructions FROM prescriptions WHERE visit_id = $1',
        [visit.id]
      );
    }
    res.json({ appointment, visit });
  } catch (err) {
    next(err);
  }
}

export async function availableSlots(req, res, next) {
  try {
    const { doctor_id, date } = req.query;
    if (!doctor_id || !date) {
      return res.status(400).json({ message: 'doctor_id and date are required' });
    }
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    const [schedules, booked] = await Promise.all([
      query(
        'SELECT start_time, end_time, slot_minutes FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2',
        [doctor_id, dayOfWeek]
      ),
      query(
        `SELECT start_time, end_time FROM appointments
         WHERE doctor_id = $1 AND date = $2 AND status NOT IN ('cancelled', 'no_show')`,
        [doctor_id, date]
      ),
    ]);

    const slots = [];
    for (const s of schedules) {
      const start = timeToMinutes(s.start_time);
      const end   = timeToMinutes(s.end_time);
      const step  = s.slot_minutes || 30;
      for (let t = start; t + step <= end; t += step) {
        const overlaps = booked.some(
          (b) => t < timeToMinutes(b.end_time) && t + step > timeToMinutes(b.start_time)
        );
        if (!overlaps) {
          slots.push({ start_time: minutesToTime(t), end_time: minutesToTime(t + step) });
        }
      }
    }
    res.json({ slots });
  } catch (err) {
    next(err);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const { patient_id, doctor_id, date, start_time, end_time, reason } = req.body;

    const conflicts = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND status NOT IN ('cancelled', 'no_show')
         AND start_time < $3 AND end_time > $4`,
      [doctor_id, date, end_time, start_time]
    );
    if (conflicts.length) {
      return res.status(409).json({ message: 'This time slot is no longer available' });
    }

    const rows = await query(
      `INSERT INTO appointments (patient_id, doctor_id, date, start_time, end_time, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [patient_id, doctor_id, date, start_time, end_time, reason || null, req.user.id]
    );
    res.status(201).json({ id: rows[0].id, message: 'Appointment booked' });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const rows = await query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Status updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const rows = await query('DELETE FROM appointments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
}
