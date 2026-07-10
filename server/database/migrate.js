/**
 * Clinic Management — Supabase migration script
 * Usage: node --env-file=../.env database/migrate.js [--seed]
 *
 * Flags:
 *   --schema   run schema only (default if no flags)
 *   --seed     run seed only
 *   --all      run schema then seed
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

const client = new Client({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 6543),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});

async function runFile(filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n[migrate] Running ${label}...`);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`[migrate] ${label} — OK`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`${label} failed: ${err.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const runSchema = args.length === 0 || args.includes('--schema') || args.includes('--all');
  const runSeed   = args.includes('--seed')   || args.includes('--all');

  await client.connect();
  console.log('[migrate] Connected to PostgreSQL');

  if (runSchema) {
    await runFile(path.join(__dirname, 'schema.sql'), 'schema.sql');
  }
  if (runSeed) {
    await runFile(path.join(__dirname, 'seed.sql'), 'seed.sql');
  }

  // Verify row counts
  const tables = ['users','doctors','doctor_schedules','patients','appointments',
                  'visits','prescriptions','invoices','invoice_items','payments'];
  console.log('\n[migrate] Row counts:');
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) AS n FROM ${t}`);
    console.log(`  ${t.padEnd(20)} ${res.rows[0].n}`);
  }

  await client.end();
  console.log('\n[migrate] Done.');
}

main().catch(err => {
  console.error('[migrate] FATAL:', err.message);
  process.exit(1);
});
