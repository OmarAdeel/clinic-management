import { query } from '../config/db.js';

/** Resolve the patient record linked to the logged-in portal user. */
async function myPatient(userId) {
  const rows = await query('SELECT * FROM patients WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

export async function myProfile(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    res.json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function myAppointments(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const rows = await query(
      `SELECT a.id, a.date, a.start_time, a.end_time, a.status, a.reason,
              du.name AS doctor_name, d.specialty, d.color AS doctor_color
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       WHERE a.patient_id = ?
       ORDER BY a.date DESC, a.start_time DESC`,
      [patient.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function myPrescriptions(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const rows = await query(
      `SELECT rx.id, rx.medication, rx.dosage, rx.frequency, rx.duration, rx.instructions,
              a.date, du.name AS doctor_name, v.diagnosis
       FROM prescriptions rx
       JOIN visits v ON v.id = rx.visit_id
       JOIN appointments a ON a.id = v.appointment_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       WHERE a.patient_id = ?
       ORDER BY a.date DESC`,
      [patient.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function myInvoices(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const rows = await query(
      `SELECT i.id, i.invoice_number, i.total, i.status, i.created_at,
              COALESCE(SUM(pay.amount), 0) AS paid_amount
       FROM invoices i
       LEFT JOIN payments pay ON pay.invoice_id = i.id
       WHERE i.patient_id = ?
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [patient.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/** Portal booking: same conflict check, patient_id comes from the session. */
export async function bookAppointment(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });

    const { doctor_id, date, start_time, end_time, reason } = req.body;
    const conflicts = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND date = ? AND status NOT IN ('cancelled', 'no_show')
         AND start_time < ? AND end_time > ?`,
      [doctor_id, date, end_time, start_time]
    );
    if (conflicts.length) {
      return res.status(409).json({ message: 'This time slot is no longer available' });
    }
    const result = await query(
      `INSERT INTO appointments (patient_id, doctor_id, date, start_time, end_time, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient.id, doctor_id, date, start_time, end_time, reason || null, req.user.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Appointment booked' });
  } catch (err) {
    next(err);
  }
}
