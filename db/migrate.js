// Applies pending db/migrations/*.sql in filename order against DATABASE_URL.
// Tracks applied files in schema_migrations so re-runs are idempotent.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL must be set');
const client = new Client({ connectionString: url });
await client.connect();
await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
const done = new Set((await client.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename));
for (const f of files) {
  if (done.has(f)) {
    console.log(`skipped ${f} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(dir, f), 'utf8');
  await client.query(sql);
  await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f]);
  console.log(`applied ${f}`);
}
await client.end();
