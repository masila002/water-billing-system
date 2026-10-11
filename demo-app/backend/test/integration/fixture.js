// Deterministic two-tenant fictional fixture for backend verification.
// Applied entirely as the restricted application role, which also proves
// the grant set is sufficient for every supported write. All names are
// test-owned; all ids are fixed test UUIDs.
'use strict';

const { Client } = require('pg');

const TENANT_A = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1';
const TENANT_B = 'b2b2b2b2-b2b2-42b2-92b2-b2b2b2b2b2b2';
// Fictional verification tariff: 75.00 KES per unit, no fixed charge.
const RATE_PER_UNIT_MINOR = 7500;
const FIXED_CHARGE_MINOR = 0;

async function applyFixture(appUrl) {
  const client = new Client({ connectionString: appUrl });
  await client.connect();
  const context = { tenantA: TENANT_A, tenantB: TENANT_B };
  try {
    for (const [key, tenantId, slug, name] of [
      ['A', TENANT_A, 'mb-test-alpha', 'MB Test Alpha Utility'],
      ['B', TENANT_B, 'mb-test-beta', 'MB Test Beta Utility'],
    ]) {
      await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenantId]);
      await client.query(
        `INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3)`,
        [tenantId, name, slug],
      );
      const tariff = await client.query(
        `INSERT INTO tariffs (tenant_id, name, fixed_charge_minor, rate_per_unit_minor, effective_from)
         VALUES ($1, 'MB Test Tariff', $2, $3, '2020-01-01')
         RETURNING id`,
        [tenantId, FIXED_CHARGE_MINOR, RATE_PER_UNIT_MINOR],
      );
      const user = await client.query(
        `INSERT INTO users (tenant_id, email, full_name, role)
         VALUES ($1, $2, 'MB Test Cashier', 'cashier')
         RETURNING id`,
        [tenantId, `cashier-${slug}@example.test`],
      );
      const customer = await client.query(
        `INSERT INTO customers (tenant_id, customer_number, full_name, phone)
         VALUES ($1, $2, $3, '+254700000000')
         RETURNING id`,
        [tenantId, `MBT-${key}-001`, `MB Test Customer ${key}`],
      );
      await client.query(
        `INSERT INTO audit_events (tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, 'customer.created', 'customer', $2, '{"fixture":true}'::jsonb)`,
        [tenantId, customer.rows[0].id],
      );
      const account = await client.query(
        `INSERT INTO service_accounts (tenant_id, customer_id, tariff_id, account_number, meter_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tenantId, customer.rows[0].id, tariff.rows[0].id, `MBT-ACC-${key}-001`, `MBT-MTR-${key}-001`],
      );
      await client.query(
        `INSERT INTO audit_events (tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, 'service_account.created', 'service_account', $2, '{"fixture":true}'::jsonb)`,
        [tenantId, account.rows[0].id],
      );
      context[`tariff${key}`] = tariff.rows[0].id;
      context[`user${key}`] = user.rows[0].id;
      context[`customer${key}`] = customer.rows[0].id;
      context[`account${key}`] = account.rows[0].id;
    }
  } finally {
    await client.end();
  }
  return context;
}

module.exports = { applyFixture, TENANT_A, TENANT_B, RATE_PER_UNIT_MINOR, FIXED_CHARGE_MINOR };
