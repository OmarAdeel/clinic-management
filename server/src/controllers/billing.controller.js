import { transaction, query } from '../config/db.js';
import { getPagination, nextInvoiceNumber } from '../utils/helpers.js';

export async function listInvoices(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req, 15);
    const clauses = [];
    const params = [];
    let idx = 1;

    if (req.query.status) {
      clauses.push(`i.status = $${idx++}`);
      params.push(req.query.status);
    }
    if (req.query.search) {
      clauses.push(`(i.invoice_number ILIKE $${idx} OR p.full_name ILIKE $${idx})`);
      params.push(`%${req.query.search}%`);
      idx++;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const [countRows, rows] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total FROM invoices i JOIN patients p ON p.id = i.patient_id ${where}`,
        params
      ),
      query(
        `SELECT i.id, i.invoice_number, i.total, i.status, i.created_at,
                p.id AS patient_id, p.full_name AS patient_name,
                COALESCE(SUM(pay.amount), 0) AS paid_amount
         FROM invoices i
         JOIN patients p ON p.id = i.patient_id
         LEFT JOIN payments pay ON pay.invoice_id = i.id
         ${where}
         GROUP BY i.id, p.id
         ORDER BY i.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
    ]);
    res.json({ data: rows, total: Number(countRows[0].total), page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const rows = await query(
      `SELECT i.*, p.full_name AS patient_name, p.phone AS patient_phone, p.address AS patient_address
       FROM invoices i JOIN patients p ON p.id = i.patient_id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });

    const [items, payments] = await Promise.all([
      query(
        'SELECT id, description, qty, unit_price, amount FROM invoice_items WHERE invoice_id = $1',
        [req.params.id]
      ),
      query(
        `SELECT pay.id, pay.amount, pay.method, pay.paid_at, u.name AS received_by_name
         FROM payments pay LEFT JOIN users u ON u.id = pay.received_by
         WHERE pay.invoice_id = $1 ORDER BY pay.paid_at`,
        [req.params.id]
      ),
    ]);
    res.json({ invoice: rows[0], items, payments });
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req, res, next) {
  try {
    const { patient_id, appointment_id, items, discount = 0, tax = 0 } = req.body;
    const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_price), 0);
    const total = Math.max(0, subtotal - Number(discount) + Number(tax));
    const invoiceNumber = await nextInvoiceNumber();

    const id = await transaction(async (q) => {
      const rows = await q(
        `INSERT INTO invoices (invoice_number, patient_id, appointment_id, subtotal, discount, tax, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid') RETURNING id`,
        [invoiceNumber, patient_id, appointment_id || null, subtotal, discount, tax, total]
      );
      const invoiceId = rows[0].id;
      for (const it of items) {
        await q(
          'INSERT INTO invoice_items (invoice_id, description, qty, unit_price, amount) VALUES ($1, $2, $3, $4, $5)',
          [invoiceId, it.description, it.qty, it.unit_price, Number(it.qty) * Number(it.unit_price)]
        );
      }
      return invoiceId;
    });

    res.status(201).json({ id, invoice_number: invoiceNumber, message: 'Invoice created' });
  } catch (err) {
    next(err);
  }
}

export async function recordPayment(req, res, next) {
  try {
    const { amount, method } = req.body;
    const invoices = await query('SELECT id, total, status FROM invoices WHERE id = $1', [req.params.id]);
    if (!invoices.length) return res.status(404).json({ message: 'Invoice not found' });
    if (invoices[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay a cancelled invoice' });
    }

    const { status, paid } = await transaction(async (q) => {
      await q(
        'INSERT INTO payments (invoice_id, amount, method, received_by) VALUES ($1, $2, $3, $4)',
        [req.params.id, amount, method || 'cash', req.user.id]
      );
      const paidRows = await q(
        'SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = $1',
        [req.params.id]
      );
      const totalPaid = Number(paidRows[0].paid);
      const newStatus = totalPaid >= Number(invoices[0].total) ? 'paid' : 'partial';
      await q('UPDATE invoices SET status = $1 WHERE id = $2', [newStatus, req.params.id]);
      return { status: newStatus, paid: totalPaid };
    });

    res.json({ message: 'Payment recorded', status, paid });
  } catch (err) {
    next(err);
  }
}

export async function cancelInvoice(req, res, next) {
  try {
    const rows = await query(
      "UPDATE invoices SET status = 'cancelled' WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice cancelled' });
  } catch (err) {
    next(err);
  }
}
