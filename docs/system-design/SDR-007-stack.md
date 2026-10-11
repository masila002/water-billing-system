# SDR-007 — stack (the real build)

Status: proposed
Owner: operator
Depends on: SDR-001
KB refs: WCSEA decision matrix + summary; Backend §33;
Frontend §29-31; Mobile §28; MB-02 ADRs

## Decision summary
TypeScript everywhere in v1: NestJS API, Next.js web,
Expo React Native mobile, Postgres + Redis, SQL-first
migrations, containers + compose for pilot.

## Options considered
| Option | Fit | Cost | Risk | KB position |
|---|---|---|---|---|
| TS monorepo v1 | shared types, hiring, agents | node images | low | house default |
| +Go ingress now | callback latency | 2nd deploy | med | on trigger |
| +Python analytics | forecasting | 3rd chain | med | on trigger |
| Flutter reader | offline polish | Dart silo | med | MB-02 pick |

## Chosen design
API NestJS 12 + Zod + pg (SQL-first, Drizzle later only
for query building). Web Next.js 16 + React 19 +
Tailwind 4 + shadcn/ui. Mobile Expo 57 + Expo Router +
expo-sqlite offline queue. DB Postgres 16 + RLS +
pgcrypto/pg_trgm/pg_stat_statements; partman later.
Queue Redis 7 + BullMQ 6. Identity in-house (Argon2id).
Storage S3-compatible. IaC Terraform/OpenTofu + compose
for sovereign. CI GitHub Actions + Trivy + Dependabot.
Observe OTel + Grafana/Loki + Sentry.
Mobile override: operator chose React Native over MB-02
Flutter for TS reuse; revisit if low-end perf misses.

## Rejected alternatives
Flutter now: splits language in field path; revisit on
measured jank/battery/sync evidence. ORM migrations:
hide RLS/partitioning; SQL reviewed instead.

## Rules specs must cite
R1 one language per layer; new language needs ADR.
R2 contracts are OpenAPI + SQL; no cross-imports.
R3 versions pinned + verified via Context7.

## Values this area owns
| Value | Source | Freshness | Failure behaviour |
|---|---|---|---|
| Pinned versions | package manifests | per PR | CI fails drift |
| Client types | generated from OpenAPI | per contract | block release |

## Open questions
SMS provider account: operator supplies at pilot.
