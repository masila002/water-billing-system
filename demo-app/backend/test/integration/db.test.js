// Direct-SQL verification suite: RLS confinement, default-deny, tenant
// scoping of the restricted role, audit append-only trigger and ledger
// cross-checks. Connects only as the restricted application role, except
// where a fresh unset connection proves the default.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Client } = require('pg');

const APP_URL = process.env.MB_INT_APP_URL;
// eslint-disable-next-line import/no-dynamic-require
const C = require(process.env.MB_INT_CONTEXT_FILE);

async function appClient() {
  const client = new Client({ connectionString: APP_URL });
  await client.connect();
  return client;
}

describe('row-level isolation for the restricted role', () => {
  it('sees nothing without a tenant setting (default-deny)', async () => {
    const client = await appClient();
    try {
      for (const table of ['customers', 'service_accounts', 'meter_readings', 'bills', 'payments']) {
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
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantB]);
      let r = await client.query(`SELECT id FROM customers`);
      const bIds = r.rows.map((x) => x.id);
      assert.ok(bIds.includes(C.customerB), 'expected fixture customer under tenant B');
      assert.ok(!bIds.includes(C.customerA), 'tenant A rows must stay invisible');
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [C.tenantA]);
      r = await client.query(`SELECT id FROM customers`);
      assert.ok(r.rows.some((x) => x.id === C.customerA));
      assert.ok(!r.rows.some((x) => x.id === C.customerB));
      await client.query(`RESET app.tenant_id`);
      r = await client.query(`SELECT COUNT(*) AS n FROM customers`);
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
  it('every supported write left an audit event', async () => {
    const client = await appClient();
    try {
      for (const tenant of [C.tenantA, C.tenantB]) {
        await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenant]);
        for (const type of ['customer.created', 'meter_reading.submitted', 'bill.generated', 'payment.recorded']) {
          const r = await client.query(`SELECT COUNT(*) AS n FROM audit_events WHERE event_type = $1`, [type]);
          assert.ok(Number(r.rows[0].n) >= 1, `expected ${type} events for tenant`);
        }
      }
    } finally {
      await client.end();
    }
  });
});
