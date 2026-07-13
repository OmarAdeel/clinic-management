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
      data: rows.map((r) => ({
        ...r,
        revenue: Number(r.revenue),
        completed_appointments: Number(r.completed_appointments),
      })),
    });
  } catch (err) {
    console.error('[Reports API] topDoctors error:', err);
    next(err);
  }
}

/** Doctor productivity per doctor (counts + cancel/no-show rates + revenue). */
export async function doctorProductivity(req, res, next) {
  try {
    const rows = await query(
      `SELECT d.id, du.name, d.specialty, d.color,
              COUNT(DISTINCT a.id) AS total_appointments,
              COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) AS completed,
              COUNT(DISTINCT CASE WHEN a.status = 'no_show'   THEN a.id END) AS no_shows,
              COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) AS cancelled,
              COALESCE(SUM(pay.amount), 0) AS revenue
       FROM doctors d
       JOIN users du ON du.id = d.user_id
       LEFT JOIN appointments a ON a.doctor_id = d.id
       LEFT JOIN invoices i ON i.appointment_id = a.id
       LEFT JOIN payments pay ON pay.invoice_id = i.id
       GROUP BY d.id, du.name, d.specialty, d.color
       ORDER BY total_appointments DESC`
    );
    const data = rows.map((r) => {
      const total = Number(r.total_appointments) || 0
      const completed = Number(r.completed) || 0
      const noShows = Number(r.no_shows) || 0
      const cancelled = Number(r.cancelled) || 0
      return {
        id: r.id,
        name: r.name,
        specialty: r.specialty,
        color: r.color,
        total_appointments: total,
        completed,
        no_shows: noShows,
        cancelled,
        no_show_rate: total ? Math.round((noShows / total) * 1000) / 10 : 0,
        cancel_rate: total ? Math.round((cancelled / total) * 1000) / 10 : 0,
        revenue: Number(r.revenue),
      }
    })
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/** Monthly no-show rate for the last N months (default 6). */
export async function noShowRateOverTime(req, res, next) {
  try {
    const months = Math.min(24, parseInt(req.query.months, 10) || 6)
    const rows = await query(
      `SELECT to_char(date_trunc('month', a.date), 'YYYY-MM') AS month,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_shows
       FROM appointments a
       WHERE a.date >= CURRENT_DATE - (${months}::int || ' months')::interval
       GROUP BY 1
       ORDER BY 1`
    )
    const data = rows.map((r) => ({
      month: r.month,
      rate: r.total > 0 ? Math.round((Number(r.no_shows) / Number(r.total)) * 1000) / 10 : 0,
      total: Number(r.total),
      no_shows: Number(r.no_shows),
    }))
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

/**
 * Revenue report for a date range (defaults to current month).
 * Returns overall totals, breakdown by payment method, and revenue by doctor.
 */
export async function revenueReport(req, res, next) {
  try {
    const from = req.query.from
      || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const to = req.query.to || new Date().toISOString().slice(0, 10);

    const [totals, byMethod, byDoctor] = await Promise.all([
      query(
        `SELECT
           COALESCE(SUM(i.subtotal), 0)  AS subtotal,
           COALESCE(SUM(i.discount), 0)   AS discount,
           COALESCE(SUM(i.tax), 0)        AS tax,
           COALESCE(SUM(i.total), 0)      AS invoiced,
           COALESCE(SUM(pay.amount), 0)   AS collected,
           COUNT(DISTINCT i.id)           AS invoice_count,
           COUNT(DISTINCT pay.id)         AS payment_count
         FROM invoices i
         LEFT JOIN payments pay ON pay.invoice_id = i.id
         WHERE i.created_at >= ? AND i.created_at <= (?::date + INTERVAL '1 day')
           AND i.status <> 'cancelled'`,
        [from, to]
      ),
      query(
        `SELECT method, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
         FROM payments
         WHERE paid_at >= ? AND paid_at <= (?::date + INTERVAL '1 day')
         GROUP BY method ORDER BY total DESC`,
        [from, to]
      ),
      query(
        `SELECT d.id, du.name, d.specialty, d.color,
                COALESCE(SUM(pay.amount), 0) AS collected,
                COUNT(DISTINCT a.id)         AS appointments
         FROM doctors d
         JOIN users du ON du.id = d.user_id
         LEFT JOIN appointments a ON a.doctor_id = d.id
           AND a.date >= ? AND a.date <= ?
         LEFT JOIN invoices i ON i.appointment_id = a.id
         LEFT JOIN payments pay ON pay.invoice_id = i.id
         GROUP BY d.id, du.name, d.specialty, d.color
         ORDER BY collected DESC`,
        [from, to]
      ),
    ]);

    const t = totals[0] || {};
    res.json({
      from,
      to,
      summary: {
        subtotal: Number(t.subtotal),
        discount: Number(t.discount),
        tax: Number(t.tax),
        invoiced: Number(t.invoiced),
        collected: Number(t.collected),
        outstanding: Number(t.invoiced) - Number(t.collected),
        invoice_count: Number(t.invoice_count),
        payment_count: Number(t.payment_count),
      },
      by_method: byMethod.map((r) => ({ method: r.method, total: Number(r.total), count: Number(r.count) })),
      by_doctor: byDoctor.map((r) => ({
        id: r.id, name: r.name, specialty: r.specialty, color: r.color,
        collected: Number(r.collected), appointments: Number(r.appointments),
      })),
    });
  } catch (err) {
    next(err);
  }
}
