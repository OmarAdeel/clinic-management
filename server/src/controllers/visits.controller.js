import { pool, query } from '../config/db.js';

/**
 * Create or update the visit record for an appointment, replacing its
 * prescription lines, and mark the appointment as completed.
 */
export async function upsertVisit(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { appointment_id, diagnosis, symptoms, notes, vitals, prescriptions = [] } = req.body;

    const appts = await query('SELECT id FROM appointments WHERE id = ?', [appointment_id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    await conn.beginTransaction();

    const existing = await query('SELECT id FROM visits WHERE appointment_id = ?', [appointment_id]);
    let visitId;
    if (existing.length) {
      visitId = existing[0].id;
      await conn.execute(
        'UPDATE visits SET diagnosis = ?, symptoms = ?, notes = ?, vitals = ? WHERE id = ?',
        [diagnosis || null, symptoms || null, notes || null, vitals ? JSON.stringify(vitals) : null, visitId]
      );
      await conn.execute('DELETE FROM prescriptions WHERE visit_id = ?', [visitId]);
    } else {
      const [result] = await conn.execute(
        'INSERT INTO visits (appointment_id, diagnosis, symptoms, notes, vitals) VALUES (?, ?, ?, ?, ?)',
        [appointment_id, diagnosis || null, symptoms || null, notes || null, vitals ? JSON.stringify(vitals) : null]
      );
      visitId = result.insertId;
    }

    for (const rx of prescriptions) {
      await conn.execute(
        'INSERT INTO prescriptions (visit_id, medication, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?)',
        [visitId, rx.medication, rx.dosage || null, rx.frequency || null, rx.duration || null, rx.instructions || null]
      );
    }

    await conn.execute("UPDATE appointments SET status = 'completed' WHERE id = ?", [appointment_id]);
    await conn.commit();
    res.json({ visit_id: visitId, message: 'Visit saved' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/** Full visit detail (for the printable prescription view). */
export async function getVisit(req, res, next) {
  try {
    const rows = await query(
      `SELECT v.*, a.date, a.start_time, a.patient_id,
              p.full_name AS patient_name, p.dob, p.gender,
              du.name AS doctor_name, d.specialty
       FROM visits v
       JOIN appointments a ON a.id = v.appointment_id
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Visit not found' });
    const visit = rows[0];
    visit.prescriptions = await query(
      'SELECT id, medication, dosage, frequency, duration, instructions FROM prescriptions WHERE visit_id = ?',
      [visit.id]
    );
    res.json({ visit });
  } catch (err) {
    next(err);
  }
}
