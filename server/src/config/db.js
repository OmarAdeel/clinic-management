import postgres from 'postgres';
import { env } from './env.js';

const isServerless = typeof globalThis.caches !== 'undefined' || process.env.NODE_ENV === 'production';

// Connection details for PostgreSQL
const dbConfig = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: false, // Disabled for direct TCP connection compatibility in Workers
};

// Cache the postgres instance for general queries
let sqlInstance = null;
function getSql() {
  if (!sqlInstance) {
    sqlInstance = postgres({
      ...dbConfig,
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
      ...dbConfig,
      max: 1,
    });
    return new WrappedConnection(conn);
  },
  
  async query(sqlStr, params = []) {
    const client = getSql();
    const [rows] = await executePgQuery(client, sqlStr, params);
    return rows;
  }
};

/**
 * Root helper to run queries and return rows directly (used by reports/read-only controllers)
 */
export async function query(sqlStr, params = []) {
  return pool.query(sqlStr, params);
}
