# SDR-003 — audit trail

Status: proposed
Owner: operator
Depends on: SDR-001
KB refs: Secure-by-design audit; Data L2 append-only

## Decision summary
Append-only audit_events in same txn as change; hash-chained
daily anchors; readers by role; 7y retention.

## Options considered
| Option | Fit | Cost | Risk | KB position |
|---|---|---|---|---|
| PG append-only + chain | simple, txn-bound | verify job | low | default |
| External ledger SaaS | managed | fees, residency | low | later |
| Logs-only | cheap | tamperable | high | rejected |

## Chosen design
```mermaid
flowchart LR
  change[Domain write] --> tx[Same txn audit row]
  tx --> chain[Hash chain + anchor]
```
Fields: actor, on-behalf-of, action, resource, outcome,
reason, redacted changes, request/trace id, hash. Events:
auth, roles, CRUD, exports, money, admin, sync conflicts.
UPDATE/DELETE revoked + trigger-blocked. Auditor read-only.
PII redacted; raw payloads separate 2y store.

## Rejected alternatives
Logs-only: mutable, rejected. Async-only audit: gap on
crash, rejected; relay allowed after commit, never before.

## Rules specs must cite
R1 audit row in same txn. R2 reason required for money,
role, reversal. R3 no PII in free text.

## Values this area owns
| Value | Source | Freshness | Failure behaviour |
|---|---|---|---|
| Who did what | audit_events chain | on commit | block write if fail |
| Chain anchors | daily anchor object | daily | alert, freeze exports |

## Open questions
None allowed at approval.
