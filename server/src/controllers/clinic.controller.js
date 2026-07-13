import { query } from '../config/db.js';
import { auditFromReq } from '../utils/audit.js';

/** GET /api/clinic — public-ish: any authenticated user gets the clinic profile. */
export async function getClinicProfile(req, res, next) {
  try {
    const rows = await query('SELECT * FROM clinic_settings WHERE id = 1');
    res.json({ clinic: rows[0] || null });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/clinic — admin only. */
export async function updateClinicProfile(req, res, next) {
  try {
    const { name, address, phone, email, tax_id, logo_url } = req.body;
    const result = await query(
      `UPDATE clinic_settings
       SET name = COALESCE(?, name),
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           tax_id = COALESCE(?, tax_id),
           logo_url = COALESCE(?, logo_url)
       WHERE id = 1`,
      [name || null, address || null, phone || null, email || null, tax_id || null, logo_url || null]
    );
    if (!result.affectedRows) {
      // Row not yet there — insert
      await query(
        `INSERT INTO clinic_settings (id, name, address, phone, email, tax_id, logo_url)
         VALUES (1, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [name || 'Clinic', address || null, phone || null, email || null, tax_id || null, logo_url || null]
      );
    }
    auditFromReq(req, 'update', 'clinic_settings', 1, { name });
    res.json({ message: 'Clinic profile updated' });
  } catch (err) {
    next(err);
  }
}
