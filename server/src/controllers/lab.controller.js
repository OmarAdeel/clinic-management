import { query } from '../config/db.js';
import { auditFromReq } from '../utils/audit.js';
import { sendNotification } from '../utils/notify.js';

/**
 * GET /api/lab-tests?patient_id=&visit_id=&status=
 * Lab tests belong to a patient; doctors/admins see all, reception sees read-only.
 */
export async function listLabTests(req, res, next) {
  try {
    const clauses = [];
    const params = [];
    if (req.query.patient_id) { clauses.push('lt.patient_id = ?'); params.push(req.query.patient_id); }
    if (req.query.visit_id)   { clauses.push('lt.visit_id = ?');   params.push(req.query.visit_id); }
    if (req.query.status)     { clauses.push('lt.status = ?');     params.push(req.query.status); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await query(
      `SELECT lt.id, lt.test_name, lt.specimen, lt.result_value, lt.unit, lt.reference_range,
              lt.abnormal, lt.status, lt.ordered_at, lt.resulted_at, lt.notes, lt.created_at,
              lt.patient_id, p.full_name AS patient_name,
              lt.visit_id, a.date AS visit_date
       FROM lab_tests lt
       JOIN patients p ON p.id = lt.patient_id
       LEFT JOIN visits v ON v.id = lt.visit_id
       LEFT JOIN appointments a ON a.id = v.appointment_id
       ${where}
       ORDER BY lt.ordered_at DESC`,
      params
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getLabTest(req, res, next) {
  try {
    const rows = await query(
      `SELECT lt.*, p.full_name AS patient_name
       FROM lab_tests lt JOIN patients p ON p.id = lt.patient_id WHERE lt.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Lab test not found' });
    res.json({ test: rows[0] });
  } catch (err) {
    next(err);
  }
}

/** Create one or more lab orders (attach to a visit, or standalone to patient). */
export async function createLabTests(req, res, next) {
  try {
    const { visit_id, patient_id, tests } = req.body;
    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ message: 'At least one test is required' });
    }
    const ids = [];
    for (const t of tests) {
      const result = await query(
        `INSERT INTO lab_tests (visit_id, patient_id, test_name, specimen, unit, reference_range, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'ordered', ?)`,
        [visit_id || null, patient_id, t.name, t.specimen || null, t.unit || null, t.reference_range || null, t.notes || null]
      );
      ids.push(result.insertId);
    }
    auditFromReq(req, 'create', 'lab_tests', ids.join(','), { patient_id, visit_id, count: ids.length });
    res.status(201).json({ ids, message: 'Lab tests ordered' });
  } catch (err) {
    next(err);
  }
}

/** Record the result for an existing lab test. */
export async function setResult(req, res, next) {
  try {
    const { result_value, unit, reference_range, abnormal, notes } = req.body;
    const existing = await query('SELECT id, patient_id, status FROM lab_tests WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Lab test not found' });
    await query(
      `UPDATE lab_tests
       SET result_value = ?, unit = ?, reference_range = ?, abnormal = ?, notes = ?, status = 'resulted', resulted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [result_value ?? null, unit ?? null, reference_range ?? null, abnormal ?? null, notes ?? null, req.params.id]
    );
    auditFromReq(req, 'update', 'lab_tests', req.params.id, { result_value, status: 'resulted' });

    // Notify the patient that their lab result is ready (graceful no-op if no
    // contact info or if Resend/Twilio keys aren't configured).
    try {
      const patientRows = await query('SELECT full_name, email, phone FROM patients WHERE id = ?', [existing[0].patient_id]);
      const testRows = await query('SELECT test_name FROM lab_tests WHERE id = ?', [req.params.id]);
      const pat = patientRows[0];
      const testName = testRows[0]?.test_name || 'a lab test';
      if (pat) {
        const body = `Hello ${pat.full_name}, your lab result for "${testName}" is now available. Reference range and any abnormal flags are noted in your patient portal.`;
        if (pat.email) {
          sendNotification({ channel: 'email', to: pat.email, subject: 'Your lab result is ready', body, relatedEntity: 'lab_tests', relatedEntityId: req.params.id });
        }
        if (pat.phone) {
          sendNotification({ channel: 'sms', to: pat.phone, body, relatedEntity: 'lab_tests', relatedEntityId: req.params.id });
        }
      }
    } catch (notifyErr) {
      console.warn('[lab] result notification failed:', notifyErr.message);
    }

    res.json({ message: 'Lab result saved' });
  } catch (err) {
    next(err);
  }
}

export async function cancelLabTest(req, res, next) {
  try {
    const result = await query("UPDATE lab_tests SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Lab test not found' });
    auditFromReq(req, 'cancel', 'lab_tests', req.params.id);
    res.json({ message: 'Lab test cancelled' });
  } catch (err) {
    next(err);
  }
}

/** Catalog CRUD (admin only). */
export async function listCatalog(req, res, next) {
  try {
    const rows = await query('SELECT id, name, specimen, reference_range, unit, price, is_active FROM lab_catalog ORDER BY name');
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function addCatalogItem(req, res, next) {
  try {
    const { name, specimen, reference_range, unit, price, is_active = true } = req.body;
    const result = await query(
      `INSERT INTO lab_catalog (name, specimen, reference_range, unit, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, specimen || null, reference_range || null, unit || null, price || 0, is_active]
    );
    auditFromReq(req, 'create', 'lab_catalog', result.insertId, { name });
    res.status(201).json({ id: result.insertId, message: 'Lab catalog item added' });
  } catch (err) {
    next(err);
  }
}
