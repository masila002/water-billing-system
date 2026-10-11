# Production decision register

Only the operator sets `approved`. Superseded rows stay.

| ID | Decision | Options considered | Chosen | Rejected + real reason | Reversibility | KB reference | Owner | Status | Approved by / date |
|---|---|---|---|---|---|---|---|---|---|
| D-001 | Architecture style | monolith, microservices, serverless | modular monolith | services: no measured need, small team | medium | WCSEA §2.3 | operator | proposed | |
| D-002 | Core language | TypeScript NestJS, ASP.NET Core, Go | TS NestJS | .NET: splits web types, slower agents | medium | Backend §33; MB-02 | operator | proposed | |
| D-003 | Web app | Next.js 16, Vite SPA, Angular | Next.js 16 + Tailwind 4 | SPA: no SSR portal story | low | Frontend §29-31 | operator | proposed | |
| D-004 | Reader mobile | Expo RN, Flutter, online-only | Expo RN offline-first | Flutter: Dart silo vs TS reuse (operator override of MB-02); online-only fails routes | medium | Mobile §28 | operator | proposed | |
| D-005 | Database | Postgres 16, MySQL, Mongo | Postgres 16 + RLS | others: no RLS/partition story | low | WCSEA DB matrix | operator | proposed | |
| D-006 | Queue/cache | Redis+BullMQ, Kafka, SQS | Redis + BullMQ | Kafka: premature at pilot volumes | low | MB-02 ADR-008 | operator | proposed | |
| D-007 | Identity | in-house, Clerk/Auth0, Keycloak | in-house Argon2id + TOTP | hosted: MAU + residency; Keycloak per-SSO later | medium | Auth decision tree | operator | proposed | |
| D-008 | Money model | ledger inbox, direct-post | inbox + double-entry | direct: irreconcilable | low | LPIP §1-7 | operator | proposed | |
| D-009 | Migrations | SQL expand/contract, ORM | plain SQL reviewed | ORM hides RLS/partition DDL | low | MB-02 ADR-010 | operator | proposed | |
| D-010 | Deploy v1 | compose pilot, K8s now, PaaS only | compose + same artifact | K8s: ops load without need | medium | WCSEA §4 | operator | proposed | |
| D-011 | Analytics/ingress | now vs on-trigger | on-trigger (Go/Py later) | now: 3 chains to review/operate | medium | MB-01 §5 | operator | proposed | |
| D-012 | Scope v1 | phased pilot, full platform | phased (API+web+mobile) | full: console/portal/extracts day one | medium | operator choice | operator | proposed | |
