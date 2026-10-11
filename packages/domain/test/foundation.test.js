import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBill, allocateFifo, addMoney } from '../src/money.js';
import { can } from '../src/policy.js';

describe('money: tariff math is deterministic', () => {
  it('15.5 units at 250.00 + 500.00 fixed = 4375.00', () => {
    const r = calculateBill({ consumedMilliUnits: 15500, tariff: { fixedChargeMinor: 50000n, ratePerUnitMinor: 25000n } });
    assert.equal(r.variableChargeMinor, 387500n);
    assert.equal(r.totalMinor, 437500n);
  });
  it('zero consumption bills fixed charge only', () => {
    const r = calculateBill({ consumedMilliUnits: 0, tariff: { fixedChargeMinor: 50000n, ratePerUnitMinor: 25000n } });
    assert.equal(r.totalMinor, 50000n);
  });
  it('rejects negative consumption', () => {
    assert.throws(() => calculateBill({ consumedMilliUnits: -1, tariff: { fixedChargeMinor: 0n, ratePerUnitMinor: 1n } }));
  });
});

describe('money: FIFO allocation', () => {
  it('fills oldest bill first', () => {
    const out = allocateFifo([{ id: 'a', balanceMinor: 100n }, { id: 'b', balanceMinor: 200n }], 150n);
    assert.deepEqual(out, [{ billId: 'a', amountMinor: 100n }, { billId: 'b', amountMinor: 50n }]);
  });
  it('rejects overpayment', () => {
    assert.throws(() => allocateFifo([{ id: 'a', balanceMinor: 100n }], 101n));
  });
  it('adds same-currency money', () => {
    assert.equal(addMoney({ amountMinor: 1n, currency: 'KES' }, { amountMinor: 2n, currency: 'KES' }).amountMinor, 3n);
  });
});

describe('policy: RBAC matrix deny by default', () => {
  it('reader cannot issue bills or record cash', () => {
    assert.equal(can('meter_reader', 'reading:submit'), true);
    assert.equal(can('meter_reader', 'bill:issue'), false);
    assert.equal(can('meter_reader', 'payment:record_cash'), false);
  });
  it('cashier cannot issue bills', () => {
    assert.equal(can('cashier', 'payment:record_cash'), true);
    assert.equal(can('cashier', 'bill:issue'), false);
  });
  it('auditor is read-only', () => {
    assert.equal(can('auditor', 'audit:read'), true);
    assert.equal(can('auditor', 'bill:issue'), false);
  });
});
