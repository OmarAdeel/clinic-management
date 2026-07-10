import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err.message);
});

/**
 * Run a parameterised query and return rows.
 * Use $1, $2 … placeholders (PostgreSQL style).
 */
export async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

/**
 * Run a callback inside a single transaction.
 * The callback receives a `q(sql, params)` function bound to the client.
 * Commits on success, rolls back on error.
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = (sql, params = []) => client.query(sql, params).then((r) => r.rows);
    const result = await callback(q);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
