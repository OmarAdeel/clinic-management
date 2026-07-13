import { query } from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Notifications sender. Uses Resend (HTTP fetch) for email and Twilio (HTTP
 * fetch) for SMS. Both run on Cloudflare Workers since they're plain fetch().
 *
 * If the API keys aren't configured, the message is still recorded in the
 * notifications table with status='pending' and a short error note — so the
 * reminders cron job is idempotent and never crashes silently.
 */

async function emailViaResend({ to, subject, body }) {
  if (!env.resendApiKey) throw new Error('RESEND_API_KEY not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.resendFrom,
      to,
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Twilio SMS uses HTTP Basic auth with AccountSid:AuthToken.
 */
async function smsViaTwilio({ to, body }) {
  if (!env.twilioAccountSid || !env.twilioAuthToken) throw new Error('TWILIO_* not configured');
  if (!env.twilioFrom) throw new Error('TWILIO_FROM_NUMBER not configured');
  const authHeader = 'Basic ' + btoa(`${env.twilioAccountSid}:${env.twilioAuthToken}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: env.twilioFrom, Body: body }).toString(),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Record + dispatch a notification. Always inserts a row in `notifications`
 * (for audit/idempotency), then attempts delivery.
 *
 * @param {Object} opts
 * @param {'email'|'sms'} opts.channel
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.body
 * @param {string} [opts.relatedEntity]
 * @param {string|number} [opts.relatedEntityId]
 * @returns {Promise<{sentAt: string} | {failedAt: string, error: string}>}
 */
export async function sendNotification({ channel, to, subject, body, relatedEntity, relatedEntityId }) {
  const insertResult = await query(
    `INSERT INTO notifications (recipient, channel, subject, body, status, related_entity, related_entity_id)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [to, channel, subject || null, body, relatedEntity || null, relatedEntityId != null ? String(relatedEntityId) : null]
  );
  const notificationId = insertResult.insertId;

  let status = 'sent';
  let errMsg = null;
  try {
    if (channel === 'email') {
      await emailViaResend({ to, subject, body });
    } else if (channel === 'sms') {
      await smsViaTwilio({ to, body });
    } else {
      throw new Error(`Unknown channel: ${channel}`);
    }
  } catch (err) {
    status = 'failed';
    errMsg = err.message;
    console.warn('[notify] delivery failed:', errMsg);
  }

  await query(
    `UPDATE notifications
     SET status = ?, error = ?, sent_at = ${status === 'sent' ? 'CURRENT_TIMESTAMP' : 'NULL'}
     WHERE id = ?`,
    status === 'sent' ? [status, null, notificationId] : [status, errMsg, notificationId]
  );

  return status === 'sent'
    ? { sentAt: new Date().toISOString() }
    : { failedAt: new Date().toISOString(), error: errMsg };
}
