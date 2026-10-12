// Direct-SQL verification suite: RLS confinement, default-deny, tenant
// scoping of the restricted role, audit append-only trigger and ledger
// cross-checks. Connects only as the restricted application role, except
// where a fresh unset connection proves the default.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Client } = require('pg');

const APP_URL = process.env.MB_INT_APP_URL;
const ADMIN_URL = process.env.MB_INT_ADMIN_URL;
// eslint-disable-next-line import/no-dynamic-require
const C = require(process.env.MB_INT_CONTEXT_FILE);

if (!ADMIN_URL) {
  throw new Error('db.test.js must run via harness.js (MB_INT_ADMIN_URL missing)');
}

// Every table carrying tenant rows, per 001_initial.sql (tenants keys by id).
const TENANT_TABLES = [
  'users',
  'customers',
  'tariffs',
  'service_accounts',
  'meter_readings',
  'bills',
  'bill_items',
  'payments',
  'payment_allocations',
  'audit_events',
];

async function appClient() {
  const client = new Client({ connectionString: APP_URL });
  await client.connect();
  return client;
}

describe('row-level isolation for the restricted role', () => {
  it('sees nothing without a tenant setting (default-deny, every table)', async () => {
    const client = await appClient();
    try {
      // S1: cover every tenant-owned table, not a subset.
      for (const table of [...TENANT_TABLES, 'tenants']) {
        const r = await client.query(`SELECT COUNT(*) AS n FROM ${table}`);
        assert.equal(Number(r.rows[0].n), 0, `expected zero ${table} rows without tenant context`);
      }
    } finally {
      await client.end();
    }
  });
  it('sees exactly one tenant at a time on a reused connection', async () => {
    const client = await appClient();
    try {
      // S1: assert tenant confinement per table via distinct tenant ids.
      for (const tenant of [C.tenantA, C.tenantB]) {
        await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenant]);
        for (const table of TENANT_TABLES) {
          const r = await client.query(`SELECT DISTINCT tenant_id AS t FROM ${table}`);
          const seen = r.rows.map((x) => x.t);
          assert.ok(seen.length >= 1, `expected ${table} rows under tenant setting`);
          assert.deepEqual(seen, [tenant], `${table} leaked another tenant`);
        }
        const t = await client.query(`SELECT id FROM tenants`);
        assert.deepEqual(t.rows.map((x) => x.id), [tenant]);
      }
      await client.query(`RESET app.tenant_id`);
      const r = await client.query(`SELECT COUNT(*) AS n FROM customers`);
      assert.equal(Number(r.rows[0].n), 0);
    } finally {
      await client.end();
    }
  });
  it('refuses cross-tenant writes at the database boundary', async () => {
    const client = await appClient();
    try {
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantB]);
      await assert.rejects(
        client.query(
          `INSERT INTO customers (tenant_id, customer_number, full_name) VALUES ($1, 'MBT-X', 'Cross')`,
          [C.tenantA],
        ),
        (error) => error.code === '42501',
      );
    } finally {
      await client.end();
    }
  });
  it('keeps the audit trail append-only', async () => {
    const client = await appClient();
    try {
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantA]);
      const one = await client.query(`SELECT id FROM audit_events LIMIT 1`);
      assert.ok(one.rowCount >= 1, 'expected audit rows from the HTTP suite');
      await assert.rejects(
        client.query(`UPDATE audit_events SET details = '{}' WHERE id = $1`, [one.rows[0].id]),
        (error) => /append-only/.test(error.message),
      );
    } finally {
      await client.end();
    }
  });
  it('rejects audit deletion even for a role that bypasses row security', async () => {
    // S12: the app role lacks DELETE, which would prove grants rather than
    // the trigger; run as superuser (RLS bypassed, trigger still fires).
    const superuser = new Client({ connectionString: ADMIN_URL });
    await superuser.connect();
    try {
      await superuser.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantA]);
      const one = await superuser.query(`SELECT id FROM audit_events LIMIT 1`);
      assert.ok(one.rowCount >= 1, 'expected audit rows from the HTTP suite');
      await assert.rejects(
        superuser.query(`DELETE FROM audit_events WHERE id = $1`, [one.rows[0].id]),
        (error) => /append-only/.test(error.message),
      );
      const still = await superuser.query(`SELECT COUNT(*) AS n FROM audit_events WHERE id = $1`, [
        one.rows[0].id,
      ]);
      assert.equal(Number(still.rows[0].n), 1);
    } finally {
      await superuser.end();
    }
  });
});

describe('ledger cross-checks', () => {
  it('allocations per bill never exceed the bill total', async () => {
    const client = await appClient();
    try {
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantA]);
      const r = await client.query(
        `SELECT b.bill_number, b.total_minor, COALESCE(SUM(pa.amount_minor), 0) AS allocated
           FROM bills b LEFT JOIN payment_allocations pa
             ON pa.tenant_id = b.tenant_id AND pa.bill_id = b.id
          GROUP BY b.bill_number, b.total_minor`,
      );
      for (const row of r.rows) {
        assert.ok(
          BigInt(row.allocated) <= BigInt(row.total_minor),
          `bill ${row.bill_number} over-allocated`,
        );
      }
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantB]);
      const r2 = await client.query(
        `SELECT b.bill_number, b.total_minor, COALESCE(SUM(pa.amount_minor), 0) AS allocated
           FROM bills b LEFT JOIN payment_allocations pa
             ON pa.tenant_id = b.tenant_id AND pa.bill_id = b.id
          GROUP BY b.bill_number, b.total_minor`,
      );
      for (const row of r2.rows) {
        assert.ok(
          BigInt(row.allocated) <= BigInt(row.total_minor),
          `bill ${row.bill_number} over-allocated`,
        );
      }
    } finally {
      await client.end();
    }
  });
  it('leaves an audit event for every supported write, keyed by entity', async () => {
    // S10/S11: per-entity proof, not per-type counts — one missing event fails.
    const pairs = [
      ['customer', 'customers'],
      ['service_account', 'service_accounts'],
      ['meter_reading', 'meter_readings'],
      ['bill', 'bills'],
      ['payment', 'payments'],
    ];
    const client = await appClient();
    try {
      for (const tenant of [C.tenantA, C.tenantB]) {
        await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenant]);
        for (const [entityType, table] of pairs) {
          const rows = await client.query(`SELECT id FROM ${table}`);
          assert.ok(rows.rowCount >= 1, `expected ${table} rows for tenant`);
          for (const row of rows.rows) {
            const hit = await client.query(
              `SELECT COUNT(*) AS n FROM audit_events WHERE entity_type = $1 AND entity_id = $2`,
              [entityType, row.id],
            );
            assert.ok(
              Number(hit.rows[0].n) >= 1,
              `missing audit event for ${entityType} ${row.id}`,
            );
          }
        }
      }
    } finally {
      await client.end();
    }
  });
});
