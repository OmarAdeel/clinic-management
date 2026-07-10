import { query } from '../config/db.js';

/** Dashboard summary cards. */
export async function summary(req, res, next) {
  try {
    const [patients, apptsToday, revenueMonth, unpaid] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM patients'),
      query('SELECT COUNT(*) AS count FROM appointments WHERE date = CURDATE()'),
      query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
         WHERE YEAR(paid_at) = YEAR(CURDATE()) AND MONTH(paid_at) = MONTH(CURDATE())`
      ),
      query(`SELECT COUNT(*) AS count FROM invoices WHERE status IN ('unpaid', 'partial')`),
    ]);
    res.json({
      total_patients: patients[0].count,
      appointments_today: apptsToday[0].count,
      revenue_this_month: Number(revenueMonth[0].total),
      pending_invoices: unpaid[0].count,
    });
  } catch (err) {
    next(err);
  }
}

/** Appointments per day for the last N days (default 14). */
export async function appointmentsPerDay(req, res, next) {
  try {
    const days = Math.min(90, parseInt(req.query.days, 10) || 14);
    const rows = await query(
      `SELECT date, COUNT(*) AS count FROM appointments
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND date <= CURDATE()
       GROUP BY date ORDER BY date`,
      [days]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/** Revenue per month for the current year. */
export async function revenuePerMonth(req, res, next) {
  try {
    const rows = await query(
      `SELECT MONTH(paid_at) AS month, COALESCE(SUM(amount), 0) AS total
       FROM payments WHERE YEAR(paid_at) = YEAR(CURDATE())
       GROUP BY MONTH(paid_at) ORDER BY month`
    );
    res.json({ data: rows.map((r) => ({ month: r.month, total: Number(r.total) })) });
  } catch (err) {
    next(err);
  }
}

/** Appointment status breakdown. */
export async function statusBreakdown(req, res, next) {
  try {
    const rows = await query(
      'SELECT status, COUNT(*) AS count FROM appointments GROUP BY status'
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/** Doctors ranked by completed appointments and revenue. */
export async function topDoctors(req, res, next) {
  try {
    const rows = await query(
      `SELECT d.id, du.name, d.specialty, d.color,
              COUNT(DISTINCT a.id) AS completed_appointments,
              COALESCE(SUM(pay.amount), 0) AS revenue
       FROM doctors d
       JOIN users du ON du.id = d.user_id
       LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status = 'completed'
       LEFT JOIN invoices i ON i.appointment_id = a.id
       LEFT JOIN payments pay ON pay.invoice_id = i.id
       GROUP BY d.id
       ORDER BY completed_appointments DESC`
    );
    res.json({
      data: rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    });
  } catch (err) {
    next(err);
  }
}
