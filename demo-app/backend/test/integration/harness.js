// Orchestrator for isolated backend verification (BV-AC1/AC2/AC9).
// One command: scratch database -> restricted roles -> schema -> fixture ->
// loopback API -> suites -> teardown of only harness-created resources.
// Any missing prerequisite fails loudly; nothing is ever skipped.
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startScratchPostgres } = require('./disposable-db');
const { provisionServer } = require('./provision');
const { applyFixture } = require('./fixture');
const { startApi } = require('./api');

const API_PORT = Number(process.env.MB_TEST_API_PORT ?? 34100);
const PG_PORT = Number(process.env.MB_TEST_PGPORT ?? 55433);

function fail(message) {
  console.error(`backend-integration: ${message}`);
  process.exitCode = 1;
}

async function runSuite(file, env) {
  return new Promise((resolve) => {
    // Suites receive only MB_INT_* plus the ambient PATH-style environment;
    // database-shaped variables are stripped so a suite can never inherit a
    // real DATABASE_URL by accident (defense in depth; suites use APP_URL).
    const suiteEnv = { ...process.env, ...env };
    for (const key of Object.keys(suiteEnv)) {
      if (/^(DATABASE_URL|PG|POSTGRES|PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)$/i.test(key)) {
        delete suiteEnv[key];
      }
    }
    const child = spawn(process.execPath, ['--test', '--test-timeout=60000', file], {
      env: suiteEnv,
      stdio: 'inherit',
    });
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  if (!Number.isInteger(API_PORT) || API_PORT < 1024 || API_PORT > 65535) {
    throw new Error(`Refusing invalid MB_TEST_API_PORT: ${process.env.MB_TEST_API_PORT}`);
  }
  if (!Number.isInteger(PG_PORT) || PG_PORT < 1024 || PG_PORT > 65535) {
    throw new Error(`Refusing invalid MB_TEST_PGPORT: ${process.env.MB_TEST_PGPORT}`);
  }
  if (API_PORT === PG_PORT) throw new Error('API and database ports must differ');

  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'majibill-int-'));
  const contextFile = path.join(workdir, 'context.json');
  const apiLog = path.join(workdir, 'api-stderr.log');

  console.log(`backend-integration: starting scratch PostgreSQL on 127.0.0.1:${PG_PORT}`);
  const server = await startScratchPostgres({ port: PG_PORT });
  let provisioned = null;
  let api = null;
  try {
    console.log('backend-integration: provisioning roles, database and schema');
    provisioned = await provisionServer(server);
    console.log(`backend-integration: test database ${provisioned.dbName} ready (credentials withheld)`);

    console.log('backend-integration: applying two-tenant fixture');
    const context = await applyFixture(provisioned.appUrl);
    fs.writeFileSync(contextFile, JSON.stringify(context));

    console.log(`backend-integration: starting API on 127.0.0.1:${API_PORT}`);
    api = await startApi({
      databaseUrl: provisioned.appUrl,
      port: API_PORT,
      tenantId: context.tenantA,
      customerId: context.customerA,
      logFile: apiLog,
    });
    console.log(`backend-integration: API healthy and wrong-database detector passed`);

    const suiteEnv = {
      MB_INT_BASE_URL: api.baseUrl,
      MB_INT_APP_URL: provisioned.appUrl,
      MB_INT_CONTEXT_FILE: contextFile,
    };
    let failed = 0;
    for (const suite of ['api.test.js', 'db.test.js']) {
      console.log(`backend-integration: running ${suite}`);
      const code = await runSuite(path.join(__dirname, suite), suiteEnv);
      if (code !== 0) {
        failed += 1;
        console.error(`backend-integration: ${suite} FAILED (exit ${code}); API log: ${apiLog}`);
      }
    }
    if (failed > 0) {
      fail(`${failed} suite(s) failed`);
    } else {
      console.log('backend-integration: all suites passed');
    }
  } finally {
    if (api) await api.stop();
    if (provisioned) {
      console.log('backend-integration: dropping test database and role');
      await provisioned.deprovision();
    }
    console.log('backend-integration: stopping scratch PostgreSQL');
    await server.stop();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.stack ?? error.message : String(error));
});
