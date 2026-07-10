import { transaction, query } from '../config/db.js';

export async function upsertVisit(req, res, next) {
  try {
    const { appointment_id, diagnosis, symptoms, notes, vitals, prescriptions = [] } = req.body;

    const appts = await query('SELECT id FROM appointments WHERE id = $1', [appointment_id]);
    if (!appts.length) return res.status(404).json({ message: 'Appointment not found' });

    const visitId = await transaction(async (q) => {
      const existing = await q('SELECT id FROM visits WHERE appointment_id = $1', [appointment_id]);
      let vid;

      if (existing.length) {
        vid = existing[0].id;
        await q(
          'UPDATE visits SET diagnosis = $1, symptoms = $2, notes = $3, vitals = $4 WHERE id = $5',
          [diagnosis || null, symptoms || null, notes || null,
           vitals ? JSON.stringify(vitals) : null, vid]
        );
        await q('DELETE FROM prescriptions WHERE visit_id = $1', [vid]);
      } else {
        const rows = await q(
          'INSERT INTO visits (appointment_id, diagnosis, symptoms, notes, vitals) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [appointment_id, diagnosis || null, symptoms || null, notes || null,
           vitals ? JSON.stringify(vitals) : null]
        );
        vid = rows[0].id;
      }

      for (const rx of prescriptions) {
        await q(
          'INSERT INTO prescriptions (visit_id, medication, dosage, frequency, duration, instructions) VALUES ($1, $2, $3, $4, $5, $6)',
          [vid, rx.medication, rx.dosage || null, rx.frequency || null, rx.duration || null, rx.instructions || null]
        );
      }

      await q("UPDATE appointments SET status = 'completed' WHERE id = $1", [appointment_id]);
      return vid;
    });

    res.json({ visit_id: visitId, message: 'Visit saved' });
  } catch (err) {
    next(err);
  }
}

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
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Visit not found' });
    const visit = rows[0];
    visit.prescriptions = await query(
      'SELECT id, medication, dosage, frequency, duration, instructions FROM prescriptions WHERE visit_id = $1',
      [visit.id]
    );
    res.json({ visit });
  } catch (err) {
    next(err);
  }
}
