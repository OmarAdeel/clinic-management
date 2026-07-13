import { pool, query } from '../config/db.js';
import { auditFromReq } from '../utils/audit.js';

const BASE_SELECT = `SELECT id, code, name, category, unit_price, is_active, created_at FROM services`;

export async function listServices(req, res, next) {
  try {
    const { active, category, search } = req.query;
    const clauses = [];
    const params = [];
    if (active === 'true') { clauses.push('is_active = TRUE'); }
    if (active === 'false') { clauses.push('is_active = FALSE'); }
    if (category) { clauses.push('category = ?'); params.push(category); }
    if (search) {
      clauses.push('(name ILIKE ? OR code ILIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await query(`${BASE_SELECT} ${where} ORDER BY name ASC`, params);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getService(req, res, next) {
  try {
    const rows = await query(`${BASE_SELECT} WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Service not found' });
    res.json({ service: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const { code, name, category, unit_price, is_active = true } = req.body;
    const result = await query(
      `INSERT INTO services (code, name, category, unit_price, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [code || null, name, category || 'other', unit_price || 0, is_active]
    );
    auditFromReq(req, 'create', 'service', result.insertId, { name, category });
    res.status(201).json({ id: result.insertId, message: 'Service created' });
  } catch (err) {
    next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const { code, name, category, unit_price, is_active } = req.body;
    const result = await query(
      `UPDATE services
       SET code = ?, name = ?, category = ?, unit_price = ?, is_active = ?
       WHERE id = ?`,
      [code || null, name, category || 'other', unit_price || 0, is_active ?? true, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Service not found' });
    auditFromReq(req, 'update', 'service', req.params.id, { name });
    res.json({ message: 'Service updated' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Service code already exists' });
    next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const result = await query('DELETE FROM services WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Service not found' });
    auditFromReq(req, 'delete', 'service', req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
}
