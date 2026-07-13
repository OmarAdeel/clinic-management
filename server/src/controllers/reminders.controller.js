import { query } from '../config/db.js';
import { sendNotification } from '../utils/notify.js';

/**
 * Find appointments occurring within ~24 hours for which a reminder hasn't
 * been sent yet, dispatch an email/SMS to the patient, and stamp
 * `reminder_sent_at` on the appointment so the next run is idempotent.
 *
 * Cloudflare Workers Cron Triggers call this function on a schedule.
 */
export async function sendDueReminders() {
  // Window: appointments whose start is between now and now+25h, not yet reminded,
  // not cancelled/no_show. Uses Postgres interval arithmetic.
  const rows = await query(
    `SELECT a.id, a.date, a.start_time, a.patient_id, p.full_name, p.email, p.phone,
            du.name AS doctor_name, d.specialty
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d  ON d.id  = a.doctor_id
     JOIN users du  ON du.id = d.user_id
     WHERE a.reminder_sent_at IS NULL
       AND a.status NOT IN ('cancelled', 'no_show', 'completed')
       AND (a.date + (a.start_time || '')::interval) <= CURRENT_TIMESTAMP + INTERVAL '25 hours'
       AND (a.date + (a.start_time || '')::interval) >= CURRENT_TIMESTAMP
     ORDER BY a.date, a.start_time`
  );

  const summary = { scanned: rows.length, emailed: 0, smsed: 0, failed: 0 };
  for (const appt of rows) {
    const dateStr = `${appt.date}T${String(appt.start_time).slice(0, 8)}`;
    const when = new Date(dateStr).toLocaleString();
    const subject = 'Appointment reminder';
    const body = `Hello ${appt.full_name},\n\nThis is a reminder of your appointment with ${appt.doctor_name} (${appt.specialty}) on ${when}.\n\n- Clinic Team`;

    let dispatched = false;
    if (appt.email) {
      const r = await sendNotification({
        channel: 'email', to: appt.email, subject, body,
        relatedEntity: 'appointment', relatedEntityId: appt.id,
      });
      if (r.sentAt) { summary.emailed += 1; dispatched = true; }
      else summary.failed += 1;
    }
    if (!dispatched && appt.phone) {
      const r = await sendNotification({
        channel: 'sms', to: appt.phone, body,
        relatedEntity: 'appointment', relatedEntityId: appt.id,
      });
      if (r.sentAt) { summary.smsed += 1; dispatched = true; }
      else summary.failed += 1;
    }

    // Always stamp sent_at so we don't retry endlessly even if no contact info
    await query('UPDATE appointments SET reminder_sent_at = CURRENT_TIMESTAMP WHERE id = ?', [appt.id]);
  }

  console.log('[reminders] run summary:', summary);
  return summary;
}

/** Mountable HTTP route: admin-triggered reminder sweep (handy for testing). */
export async function triggerReminders(req, res, next) {
  try {
    const summary = await sendDueReminders();
    res.json({ message: 'Reminder sweep completed', summary });
  } catch (err) {
    next(err);
  }
}
