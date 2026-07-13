import { query } from '../config/db.js';
import { isOnLeave } from './leave.controller.js';
import { sendNotification } from '../utils/notify.js';
import { auditFromReq } from '../utils/audit.js';

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
    if (await isOnLeave(doctor_id, date)) {
      return res.status(409).json({ message: 'Doctor is on leave on this date. Please pick another day.' });
    }
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

/** Portal: patient cancels one of their own future appointments. */
export async function cancelMyAppointment(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const { id } = req.params;
    const rows = await query(
      `SELECT id, status, date FROM appointments WHERE id = ? AND patient_id = ?`,
      [id, patient.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    const appt = rows[0];
    if (appt.status === 'completed' || appt.status === 'cancelled') {
      return res.status(400).json({ message: 'This appointment can no longer be cancelled' });
    }
    await query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [id]);
    auditFromReq(req, 'cancel', 'appointment', id, { via: 'portal' });
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    next(err);
  }
}

/** Portal: patient reschedules one of their own future appointments. */
export async function rescheduleMyAppointment(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const { id } = req.params;
    const { date, start_time, end_time } = req.body;

    const rows = await query(
      'SELECT id, status, date, doctor_id FROM appointments WHERE id = ? AND patient_id = ?',
      [id, patient.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Appointment not found' });
    const appt = rows[0];
    if (appt.status === 'completed' || appt.status === 'cancelled') {
      return res.status(400).json({ message: 'This appointment can no longer be rescheduled' });
    }

    // Leave + conflict checks against the new slot (exclude this appointment).
    if (await isOnLeave(appt.doctor_id, date)) {
      return res.status(409).json({ message: 'Doctor is on leave on this date. Please pick another day.' });
    }
    const conflicts = await query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND date = ? AND id <> ? AND status NOT IN ('cancelled', 'no_show')
         AND start_time < ? AND end_time > ?`,
      [appt.doctor_id, date, id, end_time, start_time]
    );
    if (conflicts.length) {
      return res.status(409).json({ message: 'This time slot is no longer available' });
    }

    await query(
      'UPDATE appointments SET date = ?, start_time = ?, end_time = ?, reminder_sent_at = NULL WHERE id = ?',
      [date, start_time, end_time, id]
    );
    auditFromReq(req, 'reschedule', 'appointment', id, { via: 'portal', date, start_time });
    res.json({ message: 'Appointment rescheduled' });
  } catch (err) {
    next(err);
  }
}

/** Portal: patient views their own lab test results (resulted only). */
export async function myLabResults(req, res, next) {
  try {
    const patient = await myPatient(req.user.id);
    if (!patient) return res.status(404).json({ message: 'No patient record linked to this account' });
    const rows = await query(
      `SELECT lt.id, lt.test_name, lt.specimen, lt.result_value, lt.unit, lt.reference_range,
              lt.abnormal, lt.status, lt.resulted_at, lt.ordered_at, lt.notes,
              a.date AS visit_date
       FROM lab_tests lt
       LEFT JOIN visits v ON v.id = lt.visit_id
       LEFT JOIN appointments a ON a.id = v.appointment_id
       WHERE lt.patient_id = ? AND lt.status = 'resulted'
       ORDER BY lt.resulted_at DESC NULLS LAST`,
      [patient.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}
