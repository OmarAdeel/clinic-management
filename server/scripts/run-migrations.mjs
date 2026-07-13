import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.resolve(__dirname, '../database/migrations.sql');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'postgres.fvqrhxzgkvcvybpoylzr';
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'postgres';

  if (!password) {
    throw new Error(
      'DB_PASSWORD is required. Run: DB_PASSWORD="<supabase-password>" npm run migrate'
    );
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
}

/**
 * Split a SQL script into individual statements, respecting:
 *   - dollar-quoted strings ($tag$ ... $tag$ or $$ ... $$)
 *   - single-quoted string literals ('...' with '' escapes)
 *   - line comments (-- ... \n)
 *   - block comments (/* ... *​/)
 * Semicolons inside any of the above are not treated as statement terminators.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let buf = '';
  let i = 0;
  let dollarTag = null; // non-null => currently inside $tag$ ... $tag$
  let inSingle = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);

    if (dollarTag !== null) {
      const close = `$${dollarTag}$`;
      if (rest.startsWith(close)) {
        buf += close;
        i += close.length;
        dollarTag = null;
      } else {
        buf += ch;
        i++;
      }
      continue;
    }

    if (inSingle) {
      buf += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          // escaped quote ''
          buf += "'";
          i += 2;
          continue;
        }
        inSingle = false;
      }
      i++;
      continue;
    }

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        buf += ch;
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (rest.startsWith('*/')) {
        inBlockComment = false;
        buf += '*/';
        i += 2;
      } else {
        buf += ch;
        i++;
      }
      continue;
    }

    // Not inside any special context: detect starts.
    const dollarMatch = rest.match(/^\$(\w*)\$/);
    if (dollarMatch) {
      dollarTag = dollarMatch[1];
      buf += dollarMatch[0];
      i += dollarMatch[0].length;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      i++;
      continue;
    }
    if (rest.startsWith('--')) {
      inLineComment = true;
      buf += '--';
      i += 2;
      continue;
    }
    if (rest.startsWith('/*')) {
      inBlockComment = true;
      buf += '/*';
      i += 2;
      continue;
    }
    if (ch === ';') {
      const stmt = buf.trim();
      if (stmt) statements.push(stmt);
      buf = '';
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  const last = buf.trim();
  if (last) statements.push(last);
  return statements;
}

function summarize(stmt) {
  const flat = stmt.replace(/\s+/g, ' ').trim();
  return flat.length > 80 ? flat.slice(0, 77) + '...' : flat;
}

async function main() {
  const databaseUrl = getDatabaseUrl();
  const sqlText = await fs.readFile(migrationsPath, 'utf8');
  const statements = splitSqlStatements(sqlText);

  const sql = postgres(databaseUrl, {
    ssl: 'require',
    prepare: false,
    fetch_types: false,
    max: 1,
    connect_timeout: 10,
  });

  try {
    console.log(`Applying ${statements.length} statement(s) from ${path.relative(process.cwd(), migrationsPath)}...`);
    let applied = 0;
    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt);
        applied++;
        console.log(`  [${applied}/${statements.length}] ${summarize(stmt)}`);
      } catch (err) {
        // The migration file is written idempotently (DO $$ ... EXCEPTION ...),
        // so a non-trivial error here is unexpected — surface it and stop.
        console.error(`\nFailed on statement:\n  ${summarize(stmt)}\n`);
        console.error(`Error: ${err.message}`);
        if (err.code) console.error(`Code: ${err.code}`);
        process.exitCode = 1;
        return;
      }
    }
    console.log(`\nMigrations applied successfully (${applied} statement(s)).`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  if (err.code) console.error('Code:', err.code);
  process.exit(1);
});
