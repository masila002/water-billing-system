# SDR-001 (part 2) — contracts, clients, budgets, path

Status: proposed
Depends on: SDR-001-overview §1-5

## 6. Contracts and API surface
REST + OpenAPI 3.1 under /v1. Zod DTOs; generated TS clients
in packages/contracts. One error envelope (code, message,
traceId). Pagination: cursor (created_at+id), default 25,
max 100. Limits: auth 10/min/IP + lockout; reads 300/min;
writes 60/min; webhooks 600/min; exports 5/hour.
Idempotency keys on retryable writes; webhooks verified
and replayable.

## 7. Cross-cutting
Identity module (Argon2id, rotating sessions, TOTP staff).
One can() policy shared API/web/mobile. Secrets via env.
OTel traces, JSON logs, Grafana+Loki+Sentry. BullMQ workers
(bill runs, SMS, exports) idempotent + DLQ. SQL migrations
expand/contract. Files in object storage, tenant keys.
SMS sender per tenant, opt-out, segment costing. Audit
append-only in same transaction.

## 8. Clients and parity
Reference: staff web. Reader mobile offline-first route-day
(SQLite, client UUIDs, delta sync, server validates).
One permission manifest drives both; UI hides, API enforces.

## 9. Budgets
p95 reads <400ms, writes <1s, payment visible <60s.
Pilot best-effort single VM + managed DB, measured 99.9%
target later. Financial/audit 7y, callbacks 2y, photos 2y.
RPO 15min/RTO 4h pooled. Thousands of bills in minutes.

## 10. Evolution path
NOT in v1: console, portal, Go ingress, Python analytics,
USSD, smart meters, auto WASREB, multi-region. Triggers:
consumers>3 → broker; bill-run miss → extract worker;
reports hurt OLTP → replica + mviews; SSO → OIDC adapter.

## Value-source table
| Value | Source | Owner | Freshness | Failure behaviour |
|---|---|---|---|---|
| Balance/outstanding | ledger sum per account | payments | real time | stale badge, block bills |
| Consumption | current minus previous reading | readings | on submit | reject regression |
| Bill total | tariff version math, half-up | billing | immutable | reject bad period |
| Collection rate | confirmed/billed | reports | after post | zero if none |
| Payment status | inbox + posting machine | payments | <60s | suspense + alert |
| Tariff applied | effective-dated version | billing | bill time | fail closed |
| Dates | Nairobi day, UTC storage | platform | always | reject invalid |
| Activity | audit_events append-only | audit | on commit | read-only |
