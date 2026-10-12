# QA plan — MAJIBILL proof suites (spec 01 F08)

| Suite | Proves | Runs against |
|---|---|---|
| matrix | one case per RBAC cell, deny by default | domain policy + API guards |
| two-tenant | B invisible to A: lists/reads/writes/exports/IDOR | disposable pg :5434 clone |
| rls-catalog | every tenant table enabled + forced + policy | pg catalog query |
| ledger | journals balance, allocation ≤ payment, replay idempotent | disposable DB |
| audit | append-only trigger, coverage per money write | disposable DB |
| load-skew | 10x skewed-tenant mix keeps p95 | staging cell |
