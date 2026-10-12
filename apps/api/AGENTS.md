# AGENTS.md — MajiBill backend (NestJS 10 modular monolith)

You are the agent for MajiBill's backend. Sole owner of data and
business logic. Web, mobile, MCP, AI talk to this API; nothing else
touches Postgres.

**HARD RULE: row-level security.** Every feature works with RLS
forced: new tenant table → migration with ENABLE+FORCE + policy +
two-tenant test; background writes carry the row's tenant scope.

Stack: NestJS 10.4.22, Zod 4, pg SQL-first, BullMQ 6, Redis 7.
Gates: `npm run build --workspace @majibill/core-api`,
`npm run test:production`. Tracker: `docs/trackers/api.md`.
Spec: `docs/specs/majibill/01-layers.md` (F01).

Layout: `apps/api/src/{identity,customers,accounts,readings,billing,
payments,webhooks}/` (controller thin → service txn → domain pure),
`shared/{db,auth,policy}/`. `backend/` here is a pointer only.
