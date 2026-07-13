import { query } from '../config/db.js';
import { getPagination } from '../utils/helpers.js';

/**
 * GET /api/audit?page=&limit=&user_id=&entity=&action=&from=&to=
 * Returns the most-recent-first list of audit log entries.
 */
export async function listAudit(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req, 25, 200);
    const clauses = [];
    const params = [];
    if (req.query.user_id) { clauses.push('user_id = ?'); params.push(req.query.user_id); }
    if (req.query.entity)  { clauses.push('entity = ?');  params.push(req.query.entity); }
    if (req.query.action)  { clauses.push('action = ?');  params.push(req.query.action); }
    if (req.query.from)    { clauses.push('created_at >= ?');  params.push(req.query.from); }
    if (req.query.to)      { clauses.push('created_at < ?');   params.push(`${req.query.to} 23:59:59`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const [countRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params),
      query(
        `SELECT id, user_id, user_name, role, action, entity, entity_id, details, ip_address, created_at
         FROM audit_logs ${where}
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
