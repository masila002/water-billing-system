// HTTP verification suite: supported paths, isolation, idempotency,
// rollback, concurrency and negative validation over the real API.
// Characterization gaps are asserted as current behavior and recorded as
// CF findings in the spec; nothing here is repaired.
'use strict';

const { randomUUID } = require('node:crypto');
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { Client } = require('pg');

const BASE = process.env.MB_INT_BASE_URL;
const APP_URL = process.env.MB_INT_APP_URL;
const CONTEXT_FILE = process.env.MB_INT_CONTEXT_FILE;

if (!BASE || !APP_URL || !CONTEXT_FILE) {
  throw new Error('Integration suites must run via harness.js (MB_INT_* env missing)');
}
// eslint-disable-next-line import/no-dynamic-require
const C = require(CONTEXT_FILE);

async function req(method, path, tenant, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(tenant ? { 'x-tenant-id': tenant } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    // error pages may not be JSON
  }
  return { status: res.status, body: parsed };
}

async function countAllocations(billId, tenantId) {
  const client = new Client({ connectionString: APP_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenantId]);
    const r = await client.query(
      `SELECT COALESCE(SUM(amount_minor), 0) AS total, COUNT(*) AS n FROM payment_allocations WHERE bill_id = $1`,
      [billId],
    );
    return { total: BigInt(r.rows[0].total), n: Number(r.rows[0].n) };
  } finally {
    await client.end();
  }
}

async function countAudit(entityType, entityId, tenantId) {
  const client = new Client({ connectionString: APP_URL });
  await client.connect();
  try {
    await client.query(`SELECT set_config('app.tenant_id', $1, false)`, [tenantId]);
    const r = await client.query(
      `SELECT COUNT(*) AS n FROM audit_events WHERE entity_type = $1 AND entity_id = $2`,
      [entityType, entityId],
    );
    return Number(r.rows[0].n);
  } finally {
    await client.end();
  }
}

describe('tenant header contract', () => {
  it('rejects a missing tenant header', async () => {
    const r = await req('GET', '/api/customers', null);
    assert.equal(r.status, 400);
  });
  it('rejects a malformed tenant UUID', async () => {
    const r = await req('GET', '/api/customers', 'not-a-uuid');
    assert.equal(r.status, 400);
  });
});

describe('tenant A happy path: customer to paid bill', () => {
  let billId;
  it('creates a customer, account, reading and bill totalling 75000 minor', async () => {
    const customer = await req('POST', '/api/customers', C.tenantA, {
      customerNumber: 'MBT-A-002',
      fullName: 'MB Test Walker A',
    });
    assert.equal(customer.status, 201);
    const account = await req('POST', '/api/accounts', C.tenantA, {
      customerId: customer.body.id,
      tariffId: C.tariffA,
      accountNumber: 'MBT-ACC-A-002',
      meterNumber: 'MBT-MTR-A-002',
    });
    assert.equal(account.status, 201);
    const reading = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: account.body.id,
      previousReading: 100,
      currentReading: 110,
      readAt: '2026-09-15T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-002',
    });
    assert.equal(reading.status, 201);
    // 10 units at fictional 7500 minor with zero fixed charge.
    const bill = await req('POST', '/api/bills/generate', C.tenantA, {
      serviceAccountId: account.body.id,
      meterReadingId: reading.body.id,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      dueAt: '2026-10-15',
    });
    assert.equal(bill.status, 201);
    assert.equal(BigInt(bill.body.totalMinor), 75000n);
    assert.equal(BigInt(bill.body.subtotalMinor), 75000n);
    billId = bill.body.id;
  });
  it('accepts a partial payment then the remainder and marks the bill paid', async () => {
    const accountId = (await req('GET', '/api/accounts', C.tenantA)).body.find(
      (a) => a.accountNumber === 'MBT-ACC-A-002',
    ).id;
    const p1 = await req('POST', '/api/payments', C.tenantA, {
      serviceAccountId: accountId,
      billId,
      amountMinor: 25000,
      method: 'cash',
      idempotencyKey: 'mbt-pay-a-002a',
      recordedBy: C.userA,
    });
    assert.equal(p1.status, 201);
    const mid = (await req('GET', '/api/bills', C.tenantA)).body.find((b) => b.id === billId);
    assert.equal(mid.status, 'partially_paid');
    const p2 = await req('POST', '/api/payments', C.tenantA, {
      serviceAccountId: accountId,
      billId,
      amountMinor: 50000,
      method: 'mpesa',
      externalReference: 'MBT-EXT-A1',
      idempotencyKey: 'mbt-pay-a-002b',
      recordedBy: C.userA,
    });
    assert.equal(p2.status, 201);
    const done = (await req('GET', '/api/bills', C.tenantA)).body.find((b) => b.id === billId);
    assert.equal(done.status, 'paid');
    const alloc = await countAllocations(billId, C.tenantA);
    assert.equal(alloc.total, 75000n);
    assert.equal(alloc.n, 2);
    assert.ok((await countAudit('payment', p1.body.id, C.tenantA)) >= 1);
    assert.ok((await countAudit('payment', p2.body.id, C.tenantA)) >= 1);
  });
  it('rejects any further payment against the settled bill', async () => {
    const accountId = (await req('GET', '/api/accounts', C.tenantA)).body.find(
      (a) => a.accountNumber === 'MBT-ACC-A-002',
    ).id;
    const r = await req('POST', '/api/payments', C.tenantA, {
      serviceAccountId: accountId,
      billId,
      amountMinor: 100,
      method: 'cash',
      idempotencyKey: 'mbt-pay-a-002c',
    });
    assert.equal(r.status, 400);
  });
});

describe('replay and conflict behavior', () => {
  it('replays an identical reading without new rows; conflicting reuse fails', async () => {
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const accountId = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-001').id;
    const first = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 0,
      currentReading: 5,
      readAt: '2026-09-05T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-replay',
    });
    assert.equal(first.status, 201);
    const auditsBefore = await countAudit('meter_reading', first.body.id, C.tenantA);
    const replay = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 0,
      currentReading: 5,
      readAt: '2026-09-05T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-replay',
    });
    assert.equal(replay.status, 201);
    assert.equal(replay.body.id, first.body.id);
    assert.equal(await countAudit('meter_reading', first.body.id, C.tenantA), auditsBefore);
    const conflict = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 0,
      currentReading: 6,
      readAt: '2026-09-05T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-replay',
    });
    assert.equal(conflict.status, 409);
  });
  it('replays an identical bill without new rows; conflicting reuse fails', async () => {
    const readings = (await req('GET', '/api/readings', C.tenantA)).body;
    const reading = readings.find((r) => r.accountNumber === 'MBT-ACC-A-001' && Number(r.consumption) === 5);
    const input = {
      serviceAccountId: reading.serviceAccountId,
      meterReadingId: reading.id,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      dueAt: '2026-10-15',
    };
    const first = await req('POST', '/api/bills/generate', C.tenantA, input);
    assert.equal(first.status, 201);
    const replay = await req('POST', '/api/bills/generate', C.tenantA, input);
    assert.equal(replay.status, 201);
    assert.equal(replay.body.id, first.body.id);
    const conflict = await req('POST', '/api/bills/generate', C.tenantA, {
      ...input,
      periodEnd: '2026-10-31',
    });
    assert.equal(conflict.status, 409);
  });
});

describe('tenant B isolation, rollback and concurrency', () => {
  let billB;
  it('sets up a fixture bill of 75000 minor for tenant B', async () => {
    const reading = await req('POST', '/api/readings', C.tenantB, {
      serviceAccountId: C.accountB,
      previousReading: 100,
      currentReading: 110,
      readAt: '2026-09-15T10:00:00.000Z',
      submittedBy: C.userB,
      idempotencyKey: 'mbt-rd-b-001',
    });
    assert.equal(reading.status, 201);
    const bill = await req('POST', '/api/bills/generate', C.tenantB, {
      serviceAccountId: C.accountB,
      meterReadingId: reading.body.id,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      dueAt: '2026-10-15',
    });
    assert.equal(bill.status, 201);
    assert.equal(BigInt(bill.body.totalMinor), 75000n);
    billB = bill.body.id;
  });
  it('rolls back payment, allocation and audit together on late failure', async () => {
    const bad = await req('POST', '/api/payments', C.tenantB, {
      serviceAccountId: C.accountB,
      billId: billB,
      amountMinor: 1000,
      method: 'cash',
      idempotencyKey: 'mbt-pay-b-rollback',
      recordedBy: randomUUID(),
    });
    assert.equal(bad.status, 400);
    assert.equal((await countAllocations(billB, C.tenantB)).n, 0);
    const payments = (await req('GET', '/api/payments', C.tenantB)).body;
    assert.equal(payments.length, 0);
    const still = (await req('GET', '/api/bills', C.tenantB)).body.find((b) => b.id === billB);
    assert.equal(still.status, 'issued');
  });
  it('never collects more than the remaining balance under concurrency', async () => {
    const attempts = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        req('POST', '/api/payments', C.tenantB, {
          serviceAccountId: C.accountB,
          billId: billB,
          amountMinor: 75000,
          method: 'cash',
          idempotencyKey: `mbt-pay-b-race-${n}`,
          recordedBy: C.userB,
        }),
      ),
    );
    const outcomes = attempts.map((a) => a.status).sort((x, y) => x - y);
    console.log(`concurrency outcomes (sorted HTTP statuses): ${outcomes.join(',')}`);
    assert.deepEqual(outcomes, [201, 400, 400, 400, 400]);
    const alloc = await countAllocations(billB, C.tenantB);
    assert.equal(alloc.total, 75000n);
    assert.equal(alloc.n, 1);
    const done = (await req('GET', '/api/bills', C.tenantB)).body.find((b) => b.id === billB);
    assert.equal(done.status, 'paid');
  });
  it('keeps tenants isolated across reads and writes', async () => {
    const own = await req('POST', '/api/customers', C.tenantB, {
      customerNumber: 'MBT-B-002',
      fullName: 'MB Test Walker B',
    });
    assert.equal(own.status, 201);
    const bCustomers = (await req('GET', '/api/customers', C.tenantB)).body;
    assert.ok(bCustomers.length >= 1);
    assert.ok(bCustomers.every((c) => c.id === C.customerB || c.customerNumber.startsWith('MBT-B')));
    const crossAccount = await req('POST', '/api/accounts', C.tenantB, {
      customerId: C.customerA,
      tariffId: C.tariffB,
      accountNumber: 'MBT-ACC-B-X',
      meterNumber: 'MBT-MTR-B-X',
    });
    assert.ok([400, 404].includes(crossAccount.status));
    const aReadings = (await req('GET', '/api/readings', C.tenantA)).body;
    const crossBill = await req('POST', '/api/bills/generate', C.tenantB, {
      serviceAccountId: C.accountB,
      meterReadingId: aReadings[0].id,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      dueAt: '2026-10-15',
    });
    assert.equal(crossBill.status, 404);
    // Alternating tenants returns correctly scoped data each time (BV-AC5).
    for (const [tenant, customerId] of [
      [C.tenantA, C.customerA],
      [C.tenantB, C.customerB],
      [C.tenantA, C.customerA],
    ]) {
      const list = (await req('GET', '/api/customers', tenant)).body;
      assert.ok(list.some((c) => c.id === customerId));
      assert.ok(!list.some((c) => c.id === (tenant === C.tenantA ? C.customerB : C.customerA)));
    }
  });
});

describe('characterization probes (current behavior, repaired separately)', () => {
  it('CF-02: accepts a chronologically backdated reading when values chain', async () => {
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const accountId = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-001').id;
    const r = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 5,
      currentReading: 7,
      readAt: '2026-09-01T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-backdated',
    });
    console.log(`CF-02: backdated chained reading -> HTTP ${r.status} (chain rule ignores read_at order)`);
    assert.equal(r.status, 201);
  });
  it('CF-08: replayed reading with changed notes silently returns the original', async () => {
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const accountId = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-001').id;
    const r = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 0,
      currentReading: 5,
      readAt: '2026-09-05T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-replay',
      notes: 'changed notes',
    });
    console.log(`CF-08: replay with changed notes -> HTTP ${r.status}, notes=${JSON.stringify(r.body && r.body.notes)}`);
    assert.equal(r.status, 201);
    assert.equal(r.body.notes, null);
  });
  it('CF-03: accepts overlapping but non-identical bill periods', async () => {
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const accountId = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-002').id;
    const reading = await req('POST', '/api/readings', C.tenantA, {
      serviceAccountId: accountId,
      previousReading: 110,
      currentReading: 115,
      readAt: '2026-10-05T10:00:00.000Z',
      submittedBy: C.userA,
      idempotencyKey: 'mbt-rd-a-char',
    });
    assert.equal(reading.status, 201);
    const bill = await req('POST', '/api/bills/generate', C.tenantA, {
      serviceAccountId: accountId,
      meterReadingId: reading.body.id,
      periodStart: '2026-09-15',
      periodEnd: '2026-10-15',
      dueAt: '2026-11-15',
    });
    console.log(`CF-03: overlapping period bill -> HTTP ${bill.status} (only exact period pairs are unique)`);
    assert.equal(bill.status, 201);
    assert.equal(BigInt(bill.body.totalMinor), 37500n);
  });
  it('CF-04: accepts a duplicate meter number on a new account', async () => {
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const existing = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-001');
    const r = await req('POST', '/api/accounts', C.tenantA, {
      customerId: existing.customerId,
      tariffId: C.tariffA,
      accountNumber: 'MBT-ACC-A-DUPMTR',
      meterNumber: existing.meterNumber,
    });
    console.log(`CF-04: duplicate meter number -> HTTP ${r.status} (no unique meter constraint)`);
    assert.equal(r.status, 201);
  });
  it('CF-05: list responses carry no balance fields (contract parity gap)', async () => {
    const bills = (await req('GET', '/api/bills', C.tenantA)).body;
    assert.ok(bills.length >= 1);
    for (const b of bills) {
      assert.ok(!('remainingMinor' in b) && !('paidMinor' in b) && !('balanceMinor' in b));
    }
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    for (const a of accounts) {
      assert.ok(!('balanceMinor' in a) && !('lastReading' in a));
    }
    console.log('CF-05: bills/accounts lists expose status/totals but no computed balances');
  });
  it('CF-06: payment references are unique per method, reusable across methods', async () => {
    const bills = (await req('GET', '/api/bills', C.tenantA)).body;
    const target = bills.find((b) => BigInt(b.totalMinor) === 37500n);
    const accounts = (await req('GET', '/api/accounts', C.tenantA)).body;
    const accountId = accounts.find((a) => a.accountNumber === 'MBT-ACC-A-002').id;
    const p1 = await req('POST', '/api/payments', C.tenantA, {
      serviceAccountId: accountId,
      billId: target.id,
      amountMinor: 1000,
      method: 'cash',
      externalReference: 'MBT-SHARED-REF',
      idempotencyKey: 'mbt-pay-a-shared-1',
      recordedBy: C.userA,
    });
    const p2 = await req('POST', '/api/payments', C.tenantA, {
      serviceAccountId: accountId,
      billId: target.id,
      amountMinor: 1000,
      method: 'mpesa',
      externalReference: 'MBT-SHARED-REF',
      idempotencyKey: 'mbt-pay-a-shared-2',
      recordedBy: C.userA,
    });
    console.log(`CF-06: same reference cash/mpesa -> HTTP ${p1.status}/${p2.status} (unique per tenant+method)`);
    assert.equal(p1.status, 201);
    assert.equal(p2.status, 201);
  });
});
