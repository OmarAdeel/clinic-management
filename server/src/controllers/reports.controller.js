import { query } from '../config/db.js';

/** Dashboard summary cards. */
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
       WHERE date >= CURRENT_DATE - (? * INTERVAL '1 day') AND date <= CURRENT_DATE
       GROUP BY date ORDER BY date`,
      [days]
    );
    console.log('[Reports API] appointmentsPerDay result count:', rows.length);
    res.json({ data: rows.map((r) => ({ ...r, count: Number(r.count) })) });
  } catch (err) {
    console.error('[Reports API] appointmentsPerDay error:', err);
    next(err);
  }
}

/** Revenue per month for the current year. */
export async function revenuePerMonth(req, res, next) {
  try {
    const rows = await query(
      `SELECT EXTRACT(MONTH FROM paid_at) AS month, COALESCE(SUM(amount), 0) AS total
       FROM payments WHERE EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY EXTRACT(MONTH FROM paid_at) ORDER BY month`
    );
    console.log('[Reports API] revenuePerMonth result:', rows);
    res.json({ data: rows.map((r) => ({ month: Number(r.month), total: Number(r.total) })) });
  } catch (err) {
    console.error('[Reports API] revenuePerMonth error:', err);
    next(err);
  }
}

/** Appointment status breakdown. */
export async function statusBreakdown(req, res, next) {
  try {
    const rows = await query(
      'SELECT status, COUNT(*) AS count FROM appointments GROUP BY status'
    );
    console.log('[Reports API] statusBreakdown result:', rows);
    res.json({ data: rows.map((r) => ({ ...r, count: Number(r.count) })) });
  } catch (err) {
    console.error('[Reports API] statusBreakdown error:', err);
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
       GROUP BY d.id, du.name, d.specialty, d.color
       ORDER BY completed_appointments DESC`
    );
    console.log('[Reports API] topDoctors result count:', rows.length);
    res.json({
      data: rows.map((r) => ({ ...r, revenue: Number(r.revenue), completed_appointments: Number(r.completed_appointments) })),
    });
  } catch (err) {
    console.error('[Reports API] topDoctors error:', err);
    next(err);
  }
}
