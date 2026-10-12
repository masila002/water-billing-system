# SDR-008 — data, migrations, files

Status: approved
Owner: operator
Depends on: SDR-001
KB refs: Data volume; MB-04 schema

## Decision summary
UUIDv7 keys, tenant-first indexes, monthly partitions on
hot tables, SQL expand/contract migrations, object store
for media.

## Options considered
| Option | Fit | Cost | Risk | KB position |
|---|---|---|---|---|
| SQL-first + partman | RLS/partition visible | review | low | default |
| ORM-managed | fast scaffolds | hidden DDL | med | rejected |
| No partitions v1 | simpler | later cutover | low | pilot ok |

## Chosen design
Keys UUIDv7; business numbers per-tenant sequences.
Money bigint minor + KES; rates numeric(12,4). Tenant key
first in every index; composite FKs. Monthly partitions
for readings/bills/ledger/payments/audit from v1
(pilot-small, path proven). Migrations forward-only,
CONCURRENTLY, lock timeouts, rehearsed on copy. Media:
meter photos/receipts ≤5MB in tenant keys, 2y.

## Rejected alternatives
ORM DDL: hides RLS/partitions. Late partitioning: costly
rewrite under load.

## Rules specs must cite
R1 migration reversible or expand/contract paired.
R2 no hard delete of financial rows; PII anonymise.
R3 every new index justified by query plan.

## Values this area owns
| Value | Source | Freshness | Failure behaviour |
|---|---|---|---|
| Schema version | migration ledger | deploy | block boot |
| Photo evidence | object store key | on sync | flag missing |

## Open questions
None allowed at approval.
