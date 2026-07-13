import { query } from '../config/db.js';
import { auditFromReq } from '../utils/audit.js';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
export async function listProviders(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, name, contact_phone, contact_email, is_active, created_at
       FROM insurance_providers ORDER BY name`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createProvider(req, res, next) {
  try {
    const { name, contact_phone, contact_email, is_active = true } = req.body;
    const result = await query(
      `INSERT INTO insurance_providers (name, contact_phone, contact_email, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, contact_phone || null, contact_email || null, is_active]
    );
    auditFromReq(req, 'create', 'insurance_provider', result.insertId, { name });
    res.status(201).json({ id: result.insertId, message: 'Insurance provider added' });
  } catch (err) {
    next(err);
  }
}

export async function updateProvider(req, res, next) {
  try {
    const { name, contact_phone, contact_email, is_active } = req.body;
    const result = await query(
      `UPDATE insurance_providers
       SET name = ?, contact_phone = ?, contact_email = ?, is_active = ?
       WHERE id = ?`,
      [name, contact_phone || null, contact_email || null, is_active ?? true, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Provider not found' });
    auditFromReq(req, 'update', 'insurance_provider', req.params.id, { name });
    res.json({ message: 'Insurance provider updated' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------
export async function listClaims(req, res, next) {
  try {
    const clauses = [];
    const params = [];
    if (req.query.status)     { clauses.push('c.status = ?');       params.push(req.query.status); }
    if (req.query.provider_id){ clauses.push('c.provider_id = ?');  params.push(req.query.provider_id); }
    if (req.query.patient_id) { clauses.push('c.patient_id = ?');   params.push(req.query.patient_id); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await query(
      `SELECT c.id, c.claim_number, c.amount, c.status, c.submitted_at, c.created_at,
              c.invoice_id, c.patient_id, p.full_name AS patient_name,
              c.provider_id, ip.name AS provider_name,
              i.invoice_number
       FROM insurance_claims c
       JOIN patients p ON p.id = c.patient_id
       JOIN insurance_providers ip ON ip.id = c.provider_id
       LEFT JOIN invoices i ON i.id = c.invoice_id
       ${where}
       ORDER BY c.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getClaim(req, res, next) {
  try {
    const rows = await query(
      `SELECT c.*, p.full_name AS patient_name, ip.name AS provider_name, i.invoice_number, i.total AS invoice_total
       FROM insurance_claims c
       JOIN patients p ON p.id = c.patient_id
       JOIN insurance_providers ip ON ip.id = c.provider_id
       LEFT JOIN invoices i ON i.id = c.invoice_id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Claim not found' });
    res.json({ claim: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function createClaim(req, res, next) {
  try {
    const { invoice_id, patient_id, provider_id, amount, notes, status = 'draft' } = req.body;

    // Generate sequential claim number CLM-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `CLM-${year}-`;
    const lastRows = await query(
      'SELECT claim_number FROM insurance_claims WHERE claim_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`${prefix}%`]
    );
    const last = lastRows.length ? parseInt(lastRows[0].claim_number.slice(prefix.length), 10) : 0;
    const claimNumber = `${prefix}${String(last + 1).padStart(4, '0')}`;

    const result = await query(
      `INSERT INTO insurance_claims (claim_number, invoice_id, patient_id, provider_id, amount, status, notes, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        claimNumber,
        invoice_id || null,
        patient_id,
        provider_id,
        amount || 0,
        status,
        notes || null,
        status === 'submitted' ? new Date() : null,
      ]
    );
    auditFromReq(req, 'create', 'insurance_claim', result.insertId, { claimNumber, patient_id, provider_id });
    res.status(201).json({ id: result.insertId, claim_number: claimNumber, message: 'Insurance claim created' });
  } catch (err) {
    next(err);
  }
}

/** Update only the lifecycle status of a claim. */
export async function updateClaimStatus(req, res, next) {
  try {
    const { status } = req.body;
    const existing = await query('SELECT id, status FROM insurance_claims WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Claim not found' });

    const submitted = status === 'submitted' && existing[0].status !== 'submitted' ? new Date() : null;
    await query(
      `UPDATE insurance_claims
       SET status = ?, submitted_at = COALESCE(?, submitted_at)
       WHERE id = ?`,
      [status, submitted, req.params.id]
    );
    auditFromReq(req, 'update', 'insurance_claim', req.params.id, { status });
    res.json({ message: 'Claim status updated' });
  } catch (err) {
    next(err);
  }
}
