import { pool, query } from '../config/db.js';

/**
 * Insert a row into audit_logs. Safe to call without await — failures here
 * should never break the user's request.
 */
export async function audit({ userId, userName, role, action, entity, entityId, details, ip }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_name, role, action, entity, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?)`,
      [
        userId ?? null,
        userName ?? null,
        role ?? null,
        action,
        entity ?? null,
        entityId != null ? String(entityId) : null,
        details ? JSON.stringify(details) : '{}',
        ip ?? null,
      ]
    );
  } catch (err) {
    console.error('[audit] failed to write log:', err.message);
  }
}

/** Convenience: build an audit payload from the authenticated request. */
export function auditFromReq(req, action, entity, entityId, details) {
  return audit({
    userId: req.user?.id,
    userName: req.user?.name,
    role: req.user?.role,
    action,
    entity,
    entityId,
    details,
    ip: req.ip || req.socket?.remoteAddress || null,
  });
}
