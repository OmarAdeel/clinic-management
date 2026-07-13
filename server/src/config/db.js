import postgres from 'postgres';
import { env } from './env.js';

const isServerless = typeof globalThis.caches !== 'undefined' || process.env.NODE_ENV === 'production';

/**
 * Resolve connection config lazily on each use, so env bindings (populated by
 * `nodejs_compat_populate_process_env` / Wrangler secrets) are read at query
 * time rather than module-import time.
 *
 * Supabase's Postgres pooler requires TLS, so we enable `ssl: 'require'` in
 * production. Local dev (non-serverless) can connect without SSL.
 */
function getDbConfig() {
  // Prefer Cloudflare Hyperdrive when available: it provides a persistent
  // Postgres pool at Cloudflare's edge, so the Worker talks to it over one
  // optimized path instead of opening a raw TCP socket per query (which is
  // what exhausts the Workers subrequest limit against external Postgres).
  const connString = env.hyperdriveConnectionString;
  if (connString) {
    return {
      connectionString: connString,
      ssl: 'require',
      prepare: false, // disable prepared statements (serverless-friendly)
    };
  }
  const password = env.db.password;
  if (!password && isServerless) {
    console.error('[db] DB_PASSWORD is not set — connection will fail. Run `wrangler secret put DB_PASSWORD`.');
  }
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password,
    database: env.db.database,
    ssl: isServerless ? 'require' : false,
    prepare: false, // disable prepared statements (serverless-friendly)
    connect_timeout: isServerless ? 2 : 10,
  };
}

// Cache the postgres instance for general queries (non-serverless only)
let sqlInstance = null;
function getSql() {
  if (!sqlInstance) {
    sqlInstance = postgres({
      ...getDbConfig(),
      max: isServerless ? 1 : 10,
      idle_timeout: isServerless ? 1 : 30,
      connect_timeout: 5,
    });
  }
  return sqlInstance;
}

/**
 * Translates MySQL-style '?' query parameters to PostgreSQL '$1, $2, ...' placeholders.
 * Also appends 'RETURNING id' to INSERT queries to simulate MySQL's auto-generated IDs.
 */
function translateQuery(sql) {
  let index = 1;
  let pgSql = sql.replace(/\?/g, () => `$${index++}`);

  const trimmed = pgSql.trim().toLowerCase();
  if (trimmed.startsWith('insert') && !trimmed.includes('returning')) {
    if (pgSql.endsWith(';')) {
      pgSql = pgSql.slice(0, -1) + ' RETURNING id;';
    } else {
      pgSql = pgSql + ' RETURNING id';
    }
  }
  return pgSql;
}

/**
 * Runs a query and formats the result to look like the MySQL driver output.
 */
async function executePgQuery(conn, sqlStr, params) {
  const pgSql = translateQuery(sqlStr);
  try {
    const res = await conn.unsafe(pgSql, params);
    const trimmed = sqlStr.trim().toLowerCase();
    
    if (trimmed.startsWith('select')) {
      return [Array.from(res), null];
    } else {
      // For INSERT/UPDATE/DELETE, return a mock MySQL ResultSetHeader
      const insertId = res[0]?.id || null;
      return [{
        insertId: insertId,
        affectedRows: res.count || 0,
        warningStatus: 0
      }, null];
    }
  } catch (err) {
    // Map Postgres unique violation error to MySQL duplicate entry error code
    if (err.code === '23505') {
      err.code = 'ER_DUP_ENTRY';
    }
    throw err;
  }
}

/**
 * A wrapper to emulate MySQL-style Connection objects
 */
class WrappedConnection {
  constructor(conn) {
    this.conn = conn;
  }

  async beginTransaction() {
    await this.conn.unsafe('BEGIN');
  }

  async commit() {
    await this.conn.unsafe('COMMIT');
  }

  async rollback() {
    await this.conn.unsafe('ROLLBACK');
  }

  async release() {
    await this.conn.end();
  }

  async execute(sqlStr, params = []) {
    return executePgQuery(this.conn, sqlStr, params);
  }

  async query(sqlStr, params = []) {
    return executePgQuery(this.conn, sqlStr, params);
  }
}

// Emulate a MySQL pool interface
export const pool = {
  async getConnection() {
    // Create a dedicated single-use connection for the transaction lifecycle
    const conn = postgres({
      ...getDbConfig(),
      max: 1,
      connect_timeout: 2,
    });
    return new WrappedConnection(conn);
  },
  
  async query(sqlStr, params = []) {
    if (isServerless) {
      const client = postgres({
        ...getDbConfig(),
        max: 1,
        connect_timeout: 2,
      });
      try {
        const [rows] = await executePgQuery(client, sqlStr, params);
        return rows;
      } finally {
        await client.end();
      }
    } else {
      const client = getSql();
      const [rows] = await executePgQuery(client, sqlStr, params);
      return rows;
    }
  }
};

/**
 * Root helper to run queries and return rows directly (used by reports/read-only controllers)
 */
export async function query(sqlStr, params = []) {
  return pool.query(sqlStr, params);
}
