// Scratch PostgreSQL lifecycle for the isolated verification harness.
// Owns exactly one clearly labelled container; never lists, stops or
// touches any other container or database.
'use strict';

const { execFile } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const net = require('node:net');

const IMAGE = 'postgres:16-alpine';
const LABEL = 'majibill=test-disposable';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 60_000 }, (error, stdout, stderr) => {
      if (error) {
        error.message += `\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`;
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function portFree(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
  });
}

async function dockerAvailable() {
  try {
    await run('docker', ['version', '--format', '{{.Server.Version}}']);
    return true;
  } catch {
    return false;
  }
}

async function waitReady(name, superUser, timeoutMs = 60_000) {
  const start = Date.now();
  for (;;) {
    try {
      await run('docker', ['exec', name, 'pg_isready', '-U', superUser]);
      return;
    } catch (error) {
      if (Date.now() - start > timeoutMs) throw error;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

async function startScratchPostgres({ port }) {
  if (!(await dockerAvailable())) {
    throw new Error(
      'BV-AC1/AC9: docker is required for the disposable test database and was not found. Refusing to skip.',
    );
  }
  if (!(await portFree(port))) {
    throw new Error(`Test PostgreSQL port ${port} is already occupied. Refusing to reuse it.`);
  }
  const name = `majibill-test-pg-${process.pid}`;
  const superPassword = randomBytes(24).toString('hex');
  await run('docker', [
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--label',
    LABEL,
    '-p',
    `127.0.0.1:${port}:5432`,
    '-e',
    'POSTGRES_USER=postgres',
    '-e',
    `POSTGRES_PASSWORD=${superPassword}`,
    '-e',
    'POSTGRES_DB=postgres',
    IMAGE,
  ]);
  try {
    await waitReady(name, 'postgres');
  } catch (error) {
    try {
      await run('docker', ['stop', name]);
    } catch {
      // best effort cleanup; surface the original readiness failure
    }
    throw error;
  }
  return {
    name,
    host: '127.0.0.1',
    port,
    superUser: 'postgres',
    // NOTE: test-only ephemeral credential for a disposable container.
    // Passed to provision/API via env only; the harness never logs it.
    superPassword,
    async stop() {
      await run('docker', ['stop', name]);
    },
  };
}

module.exports = { startScratchPostgres, SCRATCH_IMAGE: IMAGE };
