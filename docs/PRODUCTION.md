# Production foundation (phased pilot v1)

Real system lives in root. `demo-app/` is the pitch demo, untouched.

```text
apps/api/      NestJS modular monolith (health only in this slice)
apps/web/      Next.js staff shell
apps/reader/   Expo React Native reader shell (offline queue next)
packages/domain/  tariff math + RBAC policy + tests
packages/contracts/ OpenAPI 3.1 source
db/migrations/ SQL-first RLS foundation (001, 002a, 002b)
infra/docker/ local Postgres + Redis + API compose
docs/system-design/ production SDR-001..010 + register (proposed)
```

Decisions D-001..D-012 are proposed; merge approves them.
Next specs: identity/sessions, customer/account/reading/bill
vertical, M-Pesa inbox + ledger posting, manifest + sync.
