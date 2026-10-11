# Spec majibill/01 — production layers scaffold

Status: Approved
Depth: beta
Scope: docs/scope/01-layers.md#F01-F11
SDRs: SDR-001/R2, SDR-007/R1-R3, SDR-009/R1-R3
Branch: feature/production/03-layers
Lockstep: none

## 1. Outcome and acceptance criteria
Same ACs as scope 01 F01-AC1..F11-AC1 (11 features, 22 checks).
This slice scaffolds every layer so each builds, gates and hosts
alone; business logic arrives in follow-up slices.

## 2. Contract and consumers
REST + OpenAPI 3.1 under /v1 (packages/contracts/openapi.yaml is
source). Consumers: staff web, reader mobile, MCP tools, AI workers —
all through the API, never the DB. Error envelope: code/message/
traceId. Pagination cursor (created_at+id), default 25, max 100.
Idempotency keys on retryable writes.

## 3. Data changes
No new entities this slice. Migrations 001/002a/002b unchanged.
Retire infra/docker/compose.yaml path (superseded by root compose).

## 4. Authorization matrix
| Role | Action | Allowed | Tenant scope | Test id |
|---|---|---|---|---|
| tenant_admin | * (pilot) | yes | own tenant | matrix-T1 |
| billing_manager | bill:issue, reading:flag | yes | own tenant | matrix-T2 |
| cashier | payment:record_cash | yes | own tenant | matrix-T3 |
| meter_reader | reading:submit | yes | own routes | matrix-T4 |
| auditor | read-only + audit:read | yes | own tenant | matrix-T5 |
| anon | any write | no | — | matrix-T6 |

### 4.1 Security, audit, observability and scale
| Item | This feature |
|---|---|
| Permissions added or used | matrix above; can() in packages/domain |
| Object checks | every read/write by id checks membership + scope |
| Tenant data | tenant_id + RLS forced everywhere; jobs carry tenant |
| Audit events | layer-scaffold audited; money events in later slices |
| Log and trace events | JSON logs (ids only), traceparent; alerts per SDR-004 |
| Scale | pilot thousands; chunked workers; replica path ready |
| Proof tests | matrix, two-tenant, RLS catalog, audit append-only |

## 5. Value-source table
| Value | Source | Owner | Freshness | Failure behaviour |
|---|---|---|---|---|
| Layer health | /v1/health + compose healthchecks | infra | 5-10s | unhealthy, alert |
| Gate verdict | per-area gate script exit code | qa | per push | block merge |
| Cost estimate | hosting table §13 | infra | per release | review on trigger |

## 6. Pagination, limits, access rate
Auth 10/min/IP + lockout; reads 300/min/user; writes 60/min/user;
webhooks 600/min/source; exports 5/hour/user.
## 7. Failure modes and edge cases
Partial migrate → forward-only fix, never edit applied file. Port
collision → 5434/6381 reserved; Griot 5433/6380 untouched. Offline
reader → queue, never silent drop. Provider down → inbox suspense +
retry. Secret in repo → rotate + purge + guard test.

## 8. UI states (if any)
Web/reader shells: loading, empty (no data / no permission /
filtered out / not yet created / load failed — distinct copy),
error with retry, success. Offline is an error with queued badge.

## 9. External APIs
| Library / provider | Pinned version | Doc reference | Status | Date |
|---|---|---|---|---|
| NestJS | 10.4.22 | https://docs.nestjs.com | VERIFIED | 2026-10-11 |
| Next.js | 16.4.0 | https://nextjs.org/docs | VERIFIED | 2026-10-11 |
| Expo SDK | 57.0.27 | https://docs.expo.dev | VERIFIED | 2026-10-11 |
| Postgres | 16-alpine | https://www.postgresql.org/docs/16/ | VERIFIED | 2026-10-11 |
| Redis/BullMQ | 7-alpine / 6.3.12 | https://docs.bullmq.io | VERIFIED | 2026-10-11 |
| Safaricom Daraja | sandbox later | https://developer.safaricom.co.ke | UNVERIFIED | 2026-10-11 |
| SMS gateway | operator supplies | tenant contract | UNVERIFIED | 2026-10-11 |

## 10. Reuse list
Searched: demo-app/backend (NestJS services, RLS middleware, money
math) — reused patterns for tenant txn, idempotency, bill math;
demo-app/database schema — superseded by db/migrations (UUIDv7 plan,
memberships, inbox, ledger, outbox added). Griot docs pattern —
mirrored for compose, ops manual, gates, trackers (not code).
Nothing copied verbatim; no shared runtime.

## 11. Uniformity
RLS enable+force in every migration with tenant tables. Healthcheck
in every compose service. AGENTS.md per layer. Tracker per area.
Error envelope + pagination rule identical across modules.

## 12. Test and verify plan
| AC id | Verify step | Automated test | Authz-negative test |
|---|---|---|---|
| F01-AC1/AC2 | build api, curl /v1/health | tsc + curl | 401 without session (later) |
| F02-AC1 | build staff-web | next build | hidden action → 403 (later) |
| F03-AC1 | expo start, queue reading offline | device gate (slice) | other-tenant id → not-found |
| F04-AC1/AC2 | fresh migrate + RLS catalog | migrate.js + SQL | two-tenant probe |
| F05-AC1/AC2 | config -q + up healthy | compose | — |
| F06-AC1 | guides render, ports true | grep ports | — |
| F07-AC1 | run scripts/check-*.py | exit 0 | — |
| F08-AC1 | qa suites vs disposable DB | vitest/jest | matrix cells |
| F09/F10-AC1 | typecheck + OBO probe | tsc + contract test | direct-DB attempt fails |
| F11-AC1 | no product import of inspo | grep guard | — |
## 13. Decisions — cost, tradeoffs, scaling, hosting per layer

| ID | Layer | Options | Chosen | Cost / tradeoff / scaling / hosting |
|---|---|---|---|---|
| L-01 | backend `apps/api` (NestJS 10 monolith) | monolith now vs microservices vs serverless | monolith, one image | Cost: 1 deployable, Node 22-alpine ~150MB. Tradeoff: single blast radius, fastest review. Scale: horizontal stateless + chunked BullMQ workers; extract on triggers. Host: Railway/fly/VM container :4000; local `npm run dev:api`. |
| L-02 | frontend `apps/web` (Next.js 16 staff) | Next.js vs Vite SPA vs Remix | Next.js App Router | Cost: Vercel free→team; SSR portal story included. Tradeoff: heavier than Vite, richer ecosystem. Scale: edge-static + API on Railway; CDN cache. Host: Vercel → Railway API rewrite. |
| L-03 | mobile `apps/reader` (Expo RN 57) | Expo RN vs Flutter vs PWA | Expo RN (operator) | Cost: one TS team, EAS builds pay-per-use. Tradeoff: low-end jank risk vs Flutter; revisit on metrics. Scale: OTA updates, SQLite route-day offline. Host: EAS → Play Store; API-only backend calls. |
| L-04 | db `db/` (Postgres 16 SQL-first) | Postgres vs MySQL/Mongo vs ORM DDL | Postgres + RLS forced, plain SQL | Cost: managed ~$15-50/mo pilot; sovereign free. Tradeoff: review discipline for migrations. Scale: replica + mviews + monthly partitions; cells before sharding. Host: local :5434 compose; prod managed PITR. |
| L-05 | cache/jobs (Redis 7 + BullMQ 6) | Redis vs Kafka/SQS vs inline | Redis + BullMQ | Cost: tiny (Upstash free→$10). Tradeoff: no cross-region log; enough for pilot. Scale: separate worker pool; DLQ + retries. Host: local :6381; prod Upstash/managed. |
| L-06 | infra/devops (compose + Docker + CI) | compose vs K8s vs PaaS-only | compose pilot, same image everywhere | Cost: 1 VM pilot. Tradeoff: single-box ceiling; K8s later. Scale: silo cells via Terraform; blue-green on triggers. Host: GH Actions → registry → Railway/VM. |
| L-07 | docs + project-kit | Docusaurus vs md-in-repo | md-in-repo | Cost: zero. Tradeoff: no search index; fastest review. Scale: versioned with code. Host: repo + Vercel docs later. |
| L-08 | scripts/ gates | bash+py checks vs husky-only | scripts/check-*.py + npm gates | Cost: minutes per push. Tradeoff: strict but local-fast. Scale: CI matrix later. Host: pre-push + GH Actions. |
| L-09 | qa/ harness | disposable containers vs shared staging | disposable per run | Cost: CI minutes only. Tradeoff: slower than mocks, proves RLS/locks. Scale: parallel jobs. Host: GH Actions + local Docker. |
| L-10 | mcp/ server | MCP vs REST-only vs GraphQL | MCP thin tools over REST, OBO | Cost: 1 small Node svc. Tradeoff: contract upkeep. Scale: stateless, rate-limited per tenant. Host: alongside API. |
| L-11 | ai/ workers | Trigger.dev vs BullMQ-only vs vendor | BullMQ now, Trigger path later | Cost: zero new infra today. Tradeoff: LLM spend metered per tenant later. Scale: queue concurrency + budgets. Host: worker pool, OBO only, no DB creds. |
| L-12 | inspo/ + research | in-repo vs private-only | inspo/ public-safe refs; research stays private | Cost: zero. Tradeoff: curation effort. Scale: n/a. Host: repo (public-safe only). |

Register rows: D-013..D-024 mirror L-01..L-12 (proposed; merge approves).

## 14. Rollback
Layers are additive scaffolds: revert the PR, `docker compose down -v`
(dev only), demo untouched. Migrations forward-only; applied-file
fixes go in a new file. No prod data exists yet.

## 15. Open assumptions
ASSUMPTION(A-01): SMS provider + Sender ID supplied at pilot (operator).
ASSUMPTION(A-02): Daraja Paybill vs Till per tenant decided at onboarding.
ASSUMPTION(A-03): Staging/prod hosts confirmed before first deploy slice.
