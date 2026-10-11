# Production decision register

Only the operator sets `approved`. Superseded rows stay.

| ID | Decision | Options considered | Chosen | Rejected + real reason | Reversibility | KB reference | Owner | Status | Approved by / date |
|---|---|---|---|---|---|---|---|---|---|
| D-001 | Architecture style | monolith, microservices, serverless | modular monolith | services: no measured need, small team | medium | WCSEA §2.3 | operator | approved | PR #10 2026-10-11 |
| D-002 | Core language | TypeScript NestJS, ASP.NET Core, Go | TS NestJS | .NET: splits web types, slower agents | medium | Backend §33; MB-02 | operator | approved | PR #10 2026-10-11 |
| D-003 | Web app | Next.js 16, Vite SPA, Angular | Next.js 16 + Tailwind 4 | SPA: no SSR portal story | low | Frontend §29-31 | operator | approved | PR #10 2026-10-11 |
| D-004 | Reader mobile | Expo RN, Flutter, online-only | Expo RN offline-first | Flutter: Dart silo vs TS reuse (operator override of MB-02); online-only fails routes | medium | Mobile §28 | operator | approved | PR #10 2026-10-11 |
| D-005 | Database | Postgres 16, MySQL, Mongo | Postgres 16 + RLS | others: no RLS/partition story | low | WCSEA DB matrix | operator | approved | PR #10 2026-10-11 |
| D-006 | Queue/cache | Redis+BullMQ, Kafka, SQS | Redis + BullMQ | Kafka: premature at pilot volumes | low | MB-02 ADR-008 | operator | approved | PR #10 2026-10-11 |
| D-007 | Identity | in-house, Clerk/Auth0, Keycloak | in-house Argon2id + TOTP | hosted: MAU + residency; Keycloak per-SSO later | medium | Auth decision tree | operator | approved | PR #10 2026-10-11 |
| D-008 | Money model | ledger inbox, direct-post | inbox + double-entry | direct: irreconcilable | low | LPIP §1-7 | operator | approved | PR #10 2026-10-11 |
| D-009 | Migrations | SQL expand/contract, ORM | plain SQL reviewed | ORM hides RLS/partition DDL | low | MB-02 ADR-010 | operator | approved | PR #10 2026-10-11 |
| D-010 | Deploy v1 | compose pilot, K8s now, PaaS only | compose + same artifact | K8s: ops load without need | medium | WCSEA §4 | operator | approved | PR #10 2026-10-11 |
| D-011 | Analytics/ingress | now vs on-trigger | on-trigger (Go/Py later) | now: 3 chains to review/operate | medium | MB-01 §5 | operator | approved | PR #10 2026-10-11 |
| D-012 | Scope v1 | phased pilot, full platform | phased (API+web+mobile) | full: console/portal/extracts day one | medium | operator choice | operator | approved | PR #10 2026-10-11 |
| D-013 | backend monolith NestJS | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-014 | staff web Next.js | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-015 | reader Expo RN | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-016 | Postgres SQL-first RLS | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-017 | Redis+BullMQ | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-018 | compose pilot same-image | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-019 | md-in-repo docs | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-020 | scripts gates | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-021 | disposable qa | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-022 | MCP over REST OBO | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-023 | BullMQ workers now | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-024 | inspo public-safe | build-vs-buy | chosen per spec 01 §13 | alternative: see §13 | low-medium | SDR-007 | operator | approved | PR #12 2026-10-11 |
| D-025 | server sessions over JWT-only | sessions/jwt, now/later, shared/per-file, session/body | chosen per spec 02 §13 | alternative: see §13 | medium | SDR-002 | operator | proposed | |
| D-026 | TOTP staff now OTP stubbed | sessions/jwt, now/later, shared/per-file, session/body | chosen per spec 02 §13 | alternative: see §13 | medium | SDR-002 | operator | proposed | |
| D-027 | shared can() policy module | sessions/jwt, now/later, shared/per-file, session/body | chosen per spec 02 §13 | alternative: see §13 | medium | SDR-002 | operator | proposed | |
| D-028 | tenant from session+membership | sessions/jwt, now/later, shared/per-file, session/body | chosen per spec 02 §13 | alternative: see §13 | medium | SDR-002 | operator | proposed | |
| D-029 | root dev = staff-web :3001 | web/api/demo, prefix/keep, 3001/3000, names/alias | chosen per spec 03 §13 | alternative: see §13 | low | SDR-007 | operator | proposed | |
| D-030 | demo scripts namespaced demo:* | web/api/demo, prefix/keep, 3001/3000, names/alias | chosen per spec 03 §13 | alternative: see §13 | low | SDR-007 | operator | proposed | |
| D-031 | web port 3001, demo keeps 3000 | web/api/demo, prefix/keep, 3001/3000, names/alias | chosen per spec 03 §13 | alternative: see §13 | low | SDR-007 | operator | proposed | |
| D-032 | infra scripts use real service names | web/api/demo, prefix/keep, 3001/3000, names/alias | chosen per spec 03 §13 | alternative: see §13 | low | SDR-007 | operator | proposed | |
