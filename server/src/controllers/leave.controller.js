import { query } from '../config/db.js';
import { auditFromReq } from '../utils/audit.js';

export async function listLeave(req, res, next) {
  try {
    let rows;
    if (req.query.doctor_id) {
      rows = await query(
        `SELECT l.*, du.name AS doctor_name
         FROM doctor_leave l
         JOIN doctors d ON d.id = l.doctor_id
         JOIN users du ON du.id = d.user_id
         WHERE l.doctor_id = ?
         ORDER BY l.start_date DESC`,
        [req.query.doctor_id]
      );
    } else {
      rows = await query(
        `SELECT l.*, du.name AS doctor_name
         FROM doctor_leave l
         JOIN doctors d ON d.id = l.doctor_id
         JOIN users du ON du.id = d.user_id
         ORDER BY l.start_date DESC`
      );
    }
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createLeave(req, res, next) {
  try {
    const { doctor_id, start_date, end_date, reason } = req.body;
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    const doctorRows = await query('SELECT id FROM doctors WHERE id = ?', [doctor_id]);
    if (!doctorRows.length) return res.status(404).json({ message: 'Doctor not found' });

    const result = await query(
      `INSERT INTO doctor_leave (doctor_id, start_date, end_date, reason, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [doctor_id, start_date, end_date, reason || null, req.user.id]
    );
    auditFromReq(req, 'create', 'doctor_leave', result.insertId, { doctor_id, start_date, end_date });
    res.status(201).json({ id: result.insertId, message: 'Leave recorded' });
  } catch (err) {
    next(err);
  }
}

export async function deleteLeave(req, res, next) {
  try {
    const result = await query('DELETE FROM doctor_leave WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Leave record not found' });
    auditFromReq(req, 'delete', 'doctor_leave', req.params.id);
    res.json({ message: 'Leave removed' });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns true if the given doctor has approved leave covering the date.
 * Exposed for the appointments controller to consume.
 */
export async function isOnLeave(doctorId, dateStr) {
  const rows = await query(
    `SELECT id FROM doctor_leave WHERE doctor_id = ? AND ? >= start_date AND ? <= end_date LIMIT 1`,
    [doctorId, dateStr, dateStr]
  );
  return rows.length > 0;
}
