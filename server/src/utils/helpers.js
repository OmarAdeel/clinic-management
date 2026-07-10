import { query } from '../config/db.js';

export function getPagination(req, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const rows = await query(
    `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  const last = rows.length ? parseInt(rows[0].invoice_number.slice(prefix.length), 10) : 0;
  return `${prefix}${String(last + 1).padStart(4, '0')}`;
}

export function timeToMinutes(t) {
  const [h, m] = (typeof t === 'string' ? t : String(t)).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}
