# Scope 01 — MajiBill production layers (Griot-mirror)

Status: proposed
SDRs: SDR-001, SDR-002, SDR-003, SDR-004, SDR-005, SDR-006, SDR-007, SDR-008, SDR-009, SDR-010
Delivery style: skateboard (each layer builds and gates alone, composes into the platform)
Default depth: beta

## Who it is for
MajiBill engineers, reviewers and operators standing up the real
multitenant platform in root while the pitch demo stays isolated.

## Release 1 includes
| Feature | Why now | Depends on | Depth | Lockstep | Already built |
|---|---|---|---|---|---|
| F01 backend core | money path owner, sole DB writer | SDR-001..010 approved (PR #10) | beta | none | health + domain + migrations |
| F02 staff web | office workflows need a reference client | F01 health + contracts | beta | none | Next.js shell |
| F03 reader mobile | route-day offline is the field reality | F01 manifest + sync contract | beta | none | Expo shell |
| F04 database + RLS | isolation below the app is non-negotiable | F01 | beta | none | 001/002a/002b, 16 tables |
| F05 infra + devops | one-command local, same artifact prod | F01 | beta | none | root compose, Dockerfile.api |
| F06 docs + project-kit | team must know demo-vs-real + spin-up | — | beta | none | TEAM-GUIDE, DEV-MANUAL, kit 00-06 |
| F07 scripts + gates | every layer proves itself pre-push | F01..F06 | beta | none | partial npm scripts |
| F08 qa harness | two-tenant/matrix/RLS/ledger proof suites | F01, F04 | beta | none | demo suites only |
| F09 mcp server | agent tools over the API (no direct DB) | F01 manifest | alpha | none | nothing |
| F10 ai workers | bill-run/SMS/report jobs, OBO only | F01, F05 | alpha | none | BullMQ dep only |
| F11 inspo + research | design inputs quarantined from product | — | alpha | none | MB research private |

## Acceptance criteria
### F01 backend core (NestJS modular monolith)
- F01-AC1 `npm run build --workspace @majibill/core-api` exits 0
- F01-AC2 `GET /v1/health` returns service JSON on :4000
- F01-AC3 controllers thin (no SQL in controllers), domain pure
### F02 staff web (Next.js 16 reference client)
- F02-AC1 `npm run build --workspace @majibill/staff-web` exits 0
- F02-AC2 every screen defines loading/empty/error/denied states
### F03 reader mobile (Expo RN offline-first)
- F03-AC1 Expo shell boots; SQLite outbox queues a reading offline
- F03-AC2 sync pushes deltas with client UUIDs; conflicts surface
### F04 database + RLS
- F04-AC1 fresh-container migrate applies 001/002a/002b, 16 tables
- F04-AC2 RLS enabled + forced on every tenant table (catalog query clean)
- F04-AC3 two-tenant negative probe: tenant B rows invisible to A
### F05 infra + devops
- F05-AC1 `docker compose config -q` exits 0
- F05-AC2 `docker compose up -d` both stores healthy; app profile healthy
- F05-AC3 same image boots pooled/silo/sovereign compose variants
### F06 docs + project-kit
- F06-AC1 TEAM-GUIDE + DEV-MANUAL present, port map correct
- F06-AC2 project-kit 00-06 present, no secrets in docs
### F07 scripts + gates
- F07-AC1 one gate script per area, all green documented in tracker
### F08 qa harness
- F08-AC1 matrix/RLS/ledger/audit suites run against disposable DB
### F09 mcp server
- F09-AC1 MCP tools call API only (OBO); typecheck clean
### F10 ai workers
- F10-AC1 jobs idempotent + DLQ; no direct DB; OBO with request id
### F11 inspo + research
- F11-AC1 reference material only; never imported by product code

## Explicitly excluded
Go payment-ingress extract, Python analytics, platform console,
customer portal, USSD/smart meters, K8s, multi-region (all on
measured triggers per SDR-001 §10).

## Deferred, and the trigger that brings each back
| Item | Trigger |
|---|---|
| Go ingress | callback p95 miss or >3 consumers |
| Python analytics | anomaly/forecast demand |
| Console/portal | second tenant or partner onboarding |
| K8s | team >8 or multi-cell ops load |

## Open decisions
None — resolved in spec 01 §13.
