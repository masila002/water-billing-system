// API lifecycle for the verification harness: spawns the real backend with
// a sanitized environment so ambient configuration (including the repo's
// demo-app/.env) can never redirect the run at another database.
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const BACKEND_DIR = path.resolve(__dirname, '..', '..');
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

function workspaceBin(pkg, rel) {
  for (const base of [BACKEND_DIR, ROOT_DIR]) {
    const candidate = path.join(base, 'node_modules', pkg, rel);
    if (require('node:fs').existsSync(candidate)) return candidate;
  }
  throw new Error(`Required workspace binary not found: ${pkg}/${rel}`);
}

function sanitizedEnv(databaseUrl, port) {
  const env = { ...process.env };
  // Strip every ambient database/database-adjacent setting first; dotenv
  // files loaded by the API cannot override what is set explicitly here.
  for (const key of Object.keys(env)) {
    if (/^(DATABASE_URL|PG|POSTGRES|PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE|DATABASE_POOL_MAX|PORT|HOST|CORS_ORIGINS)$/i.test(key)) {
      delete env[key];
    }
  }
  const requestedTz = process.env.MB_TEST_TZ ?? 'UTC';
  // NB: Intl.supportedValuesOf('timeZone') omits the TZ-valid name 'UTC'.
  if (requestedTz !== 'UTC' && !Intl.supportedValuesOf('timeZone').includes(requestedTz)) {
    throw new Error(`Refusing unknown MB_TEST_TZ: ${requestedTz}`);
  }
  return {
    ...env,
    DATABASE_URL: databaseUrl,
    PORT: String(port),
    HOST: '127.0.0.1',
    // Runtime timezone for the API process. UTC is the default; the F04
    // regression runs Africa/Nairobi, where identical bill replays wrongly
    // 409'd before the text-comparison fix. Pinned explicitly so ambient TZ
    // can never change suite semantics by accident.
    TZ: requestedTz,
    CORS_ORIGINS: `http://127.0.0.1:${port}`,
    DATABASE_POOL_MAX: '5',
  };
}

async function waitHealth(baseUrl, timeoutMs = 30_000) {
  const start = Date.now();
  for (;;) {
    try {
      // S4: per-request deadline so a stalled listener cannot hang the poll.
      const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const body = await res.json();
        if (body && body.status === 'ok' && body.database === 'ok') return;
      }
    } catch {
      // not up yet
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`API did not become healthy at ${baseUrl} within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

// Wrong-database detector: the fixture tenant must list exactly its own
// single fixture customer, or this process is talking to the wrong database.
async function assertTestDatabase(baseUrl, tenantId, customerId) {
  const res = await fetch(`${baseUrl}/api/customers`, {
    headers: { 'x-tenant-id': tenantId },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Wrong-database probe failed with HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== customerId) {
    throw new Error(
      'Wrong-database detector tripped: fixture tenant does not list exactly its fixture customer. Refusing to test against this database.',
    );
  }
}

async function startApi({ databaseUrl, port, tenantId, customerId, logFile }) {
  const tsNode = workspaceBin('ts-node', path.join('dist', 'bin.js'));
  const child = spawn(
    process.execPath,
    [tsNode, '--transpile-only', 'src/main.ts'],
    { cwd: BACKEND_DIR, env: sanitizedEnv(databaseUrl, port), stdio: ['ignore', 'ignore', 'pipe'] },
  );
  // Persistent stderr log for failure diagnostics (no secrets: child env is
  // never printed; DATABASE_URL appears in no log line the API emits).
  const fs = require('node:fs');
  const log = fs.createWriteStream(logFile, { flags: 'w' });
  child.stderr.pipe(log);
  const baseUrl = `http://127.0.0.1:${port}`;
  const stop = () => {
    log.end();
    return new Promise((resolve) => {
      // S3: subscribe before signalling, and resolve at once when the child
      // already exited (Node never replays a fired `exit` event).
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // already exited
        }
      }, 5000);
      timer.unref();
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        child.kill('SIGTERM');
      } catch {
        // already exited between the check and the signal
        clearTimeout(timer);
        resolve();
      }
    });
  };
  try {
    await waitHealth(baseUrl);
    await assertTestDatabase(baseUrl, tenantId, customerId);
  } catch (error) {
    // S9: surface the startup log path and tail so CI output explains the cause.
    let tail = '';
    try {
      const lines = require('node:fs').readFileSync(logFile, 'utf8').trimEnd().split('\n');
      tail = lines.slice(-30).join('\n');
    } catch {
      tail = '(API log unavailable)';
    }
    await stop();
    const annotated = new Error(
      `${error instanceof Error ? error.message : String(error)}\nAPI stderr (${logFile}):\n${tail}`,
    );
    throw annotated;
  }
  return { baseUrl, stop };
}

module.exports = { startApi };
