// Applies db/migrations/*.sql in filename order against DATABASE_URL.
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
for (const f of files) {
  const sql = readFileSync(join(dir, f), 'utf8');
  await client.query(sql);
  console.log(`applied ${f}`);
}
await client.end();
