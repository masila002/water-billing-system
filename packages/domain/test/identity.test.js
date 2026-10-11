import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { newTokens, hashRefresh, refreshMatches } from '../src/sessions.js';
import { can, permissionsFor } from '../src/policy.js';

describe('sessions: token lifecycle', () => {
  it('access expires in 15 minutes', () => {
    const t = newTokens();
    const mins = (t.accessExpiresAt.getTime() - Date.now()) / 60_000;
    assert.ok(mins > 14 && mins <= 15);
  });
  it('refresh hash verifies with constant-time compare', () => {
    const t = newTokens();
    const h = hashRefresh(t.refresh);
    assert.equal(refreshMatches(t.refresh, h), true);
    assert.equal(refreshMatches(t.refresh + 'x', h), false);
  });
  it('tokens are unique', () => {
    const a = newTokens();
    const b = newTokens();
    assert.notEqual(a.refresh, b.refresh);
  });
});

describe('policy: manifest permissions', () => {
  it('tenant_admin holds full pilot matrix', () => {
    const p = permissionsFor('tenant_admin');
    for (const need of ['bill:issue', 'payment:record_cash', 'tariff:manage', 'audit:read']) {
      assert.ok(p.includes(need), `missing ${need}`);
    }
  });
  it('unknown role denies everything', () => {
    assert.equal(can('nope', 'bill:read'), false);
  });
});
