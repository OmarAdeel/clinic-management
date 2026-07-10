import { query } from '../config/db.js';

export async function summary(req, res, next) {
  try {
    const [patients, apptsToday, revenueMonth, unpaid] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM patients'),
      query('SELECT COUNT(*) AS count FROM appointments WHERE date = CURRENT_DATE'),
      query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
         WHERE EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM CURRENT_DATE)`
      ),
      query(`SELECT COUNT(*) AS count FROM invoices WHERE status IN ('unpaid', 'partial')`),
    ]);
    res.json({
      total_patients: Number(patients[0].count),
      appointments_today: Number(apptsToday[0].count),
      revenue_this_month: Number(revenueMonth[0].total),
      pending_invoices: Number(unpaid[0].count),
    });
  } catch (err) {
    next(err);
  }
}

export async function appointmentsPerDay(req, res, next) {
  try {
    const days = Math.min(90, parseInt(req.query.days, 10) || 14);
    const rows = await query(
      `SELECT date::text AS date, COUNT(*) AS count FROM appointments
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days' AND date <= CURRENT_DATE
       GROUP BY date ORDER BY date`
    );
    res.json({ data: rows.map((r) => ({ ...r, count: Number(r.count) })) });
  } catch (err) {
    next(err);
  }
}

export async function revenuePerMonth(req, res, next) {
  try {
    const rows = await query(
      `SELECT EXTRACT(MONTH FROM paid_at)::int AS month,
              COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY EXTRACT(MONTH FROM paid_at)
       ORDER BY month`
    );
    res.json({ data: rows.map((r) => ({ month: r.month, total: Number(r.total) })) });
  } catch (err) {
    next(err);
  }
}

export async function statusBreakdown(req, res, next) {
  try {
    const rows = await query(
      'SELECT status, COUNT(*) AS count FROM appointments GROUP BY status'
    );
    res.json({ data: rows.map((r) => ({ ...r, count: Number(r.count) })) });
  } catch (err) {
    next(err);
  }
}

export async function topDoctors(req, res, next) {
  try {
    const rows = await query(
      `SELECT d.id, du.name, d.specialty, d.color,
              COUNT(DISTINCT a.id)::int AS completed_appointments,
              COALESCE(SUM(pay.amount), 0) AS revenue
       FROM doctors d
       JOIN users du ON du.id = d.user_id
       LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status = 'completed'
       LEFT JOIN invoices i ON i.appointment_id = a.id
       LEFT JOIN payments pay ON pay.invoice_id = i.id
       GROUP BY d.id, du.name, d.specialty, d.color
       ORDER BY completed_appointments DESC`
    );
    res.json({
      data: rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    });
  } catch (err) {
    next(err);
  }
}
