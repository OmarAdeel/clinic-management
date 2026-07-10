import { query } from '../config/db.js';
import { getPagination } from '../utils/helpers.js';

export async function listPatients(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = (req.query.search || '').trim();
    const where = search ? 'WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?' : '';
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const [countRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM patients ${where}`, params),
      query(
        `SELECT id, full_name, dob, gender, phone, email, blood_type, created_at
         FROM patients ${where}
         ORDER BY created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
    ]);

    res.json({ data: rows, total: countRows[0].total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getPatient(req, res, next) {
  try {
    const rows = await query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Patient not found' });

    const patient = rows[0];
    const [visits, invoices] = await Promise.all([
      query(
        `SELECT v.id, v.diagnosis, v.symptoms, v.notes, v.vitals, v.created_at,
                a.date, a.start_time, du.name AS doctor_name
         FROM visits v
         JOIN appointments a ON a.id = v.appointment_id
         JOIN doctors d ON d.id = a.doctor_id
         JOIN users du ON du.id = d.user_id
         WHERE a.patient_id = ?
         ORDER BY a.date DESC, a.start_time DESC`,
        [patient.id]
      ),
      query(
        `SELECT id, invoice_number, total, status, created_at
         FROM invoices WHERE patient_id = ? ORDER BY created_at DESC`,
        [patient.id]
      ),
    ]);

    // attach prescriptions per visit
    for (const visit of visits) {
      visit.prescriptions = await query(
        'SELECT id, medication, dosage, frequency, duration, instructions FROM prescriptions WHERE visit_id = ?',
        [visit.id]
      );
    }

    res.json({ patient, visits, invoices });
  } catch (err) {
    next(err);
  }
}

export async function createPatient(req, res, next) {
  try {
    const { full_name, dob, gender, phone, email, address, blood_type, allergies, medical_notes } = req.body;
    const result = await query(
      `INSERT INTO patients (full_name, dob, gender, phone, email, address, blood_type, allergies, medical_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, dob || null, gender || null, phone || null, email || null,
       address || null, blood_type || null, allergies || null, medical_notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Patient created' });
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const { full_name, dob, gender, phone, email, address, blood_type, allergies, medical_notes } = req.body;
    const result = await query(
      `UPDATE patients SET full_name = ?, dob = ?, gender = ?, phone = ?, email = ?,
       address = ?, blood_type = ?, allergies = ?, medical_notes = ? WHERE id = ?`,
      [full_name, dob || null, gender || null, phone || null, email || null,
       address || null, blood_type || null, allergies || null, medical_notes || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient updated' });
  } catch (err) {
    next(err);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const result = await query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    next(err);
  }
}
