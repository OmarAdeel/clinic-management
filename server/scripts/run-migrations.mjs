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

async function main() {
  const databaseUrl = getDatabaseUrl();
  const sqlText = await fs.readFile(migrationsPath, 'utf8');

  const sql = postgres(databaseUrl, {
    ssl: 'require',
    prepare: false,
    fetch_types: false,
    max: 1,
    connect_timeout: 10,
  });

  try {
    console.log(`Applying migrations from ${path.relative(process.cwd(), migrationsPath)}...`);
    await sql.unsafe(sqlText);
    console.log('Migrations applied successfully.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  if (err.code) console.error('Code:', err.code);
  process.exit(1);
});
