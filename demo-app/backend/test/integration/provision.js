// Provisioning for the isolated verification harness: dedicated database,
// restricted application role and schema bootstrap inside a disposable server.
// Connects only to the server handed in by the harness (loopback scratch
// container). Creates and drops only `majibill_test_*` databases.
'use strict';

const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const APP_ROLE = 'majibill_app';
const DB_PREFIX = 'majibill_test_';
const SAFE_NAME = /^[a-z][a-z0-9_]{0,40}$/;

function quoteIdent(value) {
  if (!SAFE_NAME.test(value)) throw new Error(`Unsafe identifier refused: ${value}`);
  return `"${value}"`;
}

function quoteLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function adminUrl({ host, port, superUser, superPassword }, db = 'postgres') {
  return `postgresql://${superUser}:${encodeURIComponent(superPassword)}@${host}:${port}/${db}`;
}

// Postmaster startup on CI runners can still tear down the first client
// handshakes after the port accepts TCP (observed: ECONNRESET and
// "Connection terminated unexpectedly" within milliseconds of readiness).
// Retry any connect failure through the startup window, then fail loudly
// with the last error.
async function connectWithRetry(connectionString, label, budgetMs = 30_000) {
  const start = Date.now();
  let lastError = null;
  let attempt = 0;
  for (;;) {
    attempt += 1;
    const client = new Client({ connectionString });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        // ignore cleanup of a failed connect
      }
      if (Date.now() - start > budgetMs) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`${label} failed after ${attempt} attempts: ${lastError.message}`);
}

async function provisionServer(server) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const dbName = `${DB_PREFIX}${stamp}_${process.pid}`;
  quoteIdent(dbName);
  quoteIdent(APP_ROLE);
  const appPassword = randomBytes(24).toString('hex');

  const admin = await connectWithRetry(adminUrl(server), 'bootstrap connection');
  try {
    console.log('backend-integration: creating restricted role and test database');
    await admin.query(`DROP ROLE IF EXISTS ${quoteIdent(APP_ROLE)}`);
    await admin.query(
      `CREATE ROLE ${quoteIdent(APP_ROLE)} LOGIN PASSWORD ${quoteLiteral(appPassword)}`,
    );
    await admin.query(`CREATE DATABASE ${quoteIdent(dbName)} OWNER ${quoteIdent(server.superUser)}`);
  } finally {
    await admin.end();
  }

  const appUrl =
    `postgresql://${APP_ROLE}:${encodeURIComponent(appPassword)}` +
    `@${server.host}:${server.port}/${dbName}`;

  const db = await connectWithRetry(adminUrl(server, dbName), 'test-database connection');
  try {
    // gen_random_uuid() is core since PostgreSQL 13 (verified on
    // postgres:16-alpine with no extension installed); no extension needed.
    console.log('backend-integration: applying schema');
    const schemaPath = path.resolve(__dirname, '..', '..', '..', 'database', 'schema', '001_initial.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.query(schema);
    console.log('backend-integration: granting restricted role privileges');
    await db.query(`GRANT CONNECT ON DATABASE ${quoteIdent(dbName)} TO ${quoteIdent(APP_ROLE)}`);
    await db.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdent(APP_ROLE)}`);
    await db.query(
      `GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ${quoteIdent(APP_ROLE)}`,
    );
    await db.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdent(APP_ROLE)}`);
    await db.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO ${quoteIdent(APP_ROLE)}`,
    );
  } finally {
    await db.end();
  }

  return {
    dbName,
    appUrl,
    // Superuser connection to the test database for negative-privilege
    // probes only (S12: audit DELETE as a role that bypasses RLS but not
    // the trigger). Env-only, never logged.
    adminDbUrl: adminUrl(server, dbName),
    // NOTE: test-only ephemeral credential; env-only, never logged.
    async deprovision() {
      const killer = await connectWithRetry(adminUrl(server), 'deprovision connection');
      try {
        await killer.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [dbName],
        );
        await killer.query(`DROP DATABASE IF EXISTS ${quoteIdent(dbName)}`);
        await killer.query(`DROP ROLE IF EXISTS ${quoteIdent(APP_ROLE)}`);
      } finally {
        await killer.end();
      }
    },
  };
}

module.exports = { provisionServer, APP_ROLE, DB_PREFIX };
