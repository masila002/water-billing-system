# MajiBill team guide — demo vs real, hosting, why

For every engineer, designer and reviewer joining this repo. Read this
before touching code. Ten minutes, no prerequisites.

## 1. Two systems, one repo, zero shared runtime

| | `demo-app/` — the pitch demo | Root — **`MAJIBILL`**, the real product |
|---|---|---|
| Purpose | Win the meeting: under-ten-minute customer-to-receipt story | Serve utilities: correct, auditable, multitenant billing |
| Users | Presenter + audience | Clerk, reader, cashier, accountant, admin, auditor |
| Data | Fictional, in the browser (localStorage), resettable | Real, in Postgres, backed up, never reset casually |
| Money | Simulated M-Pesa (no prompt, no settlement) | Daraja C2B inbox → balanced ledger journals |
| Identity | Selectable personas (no passwords) | Argon2id sessions, TOTP, RBAC matrix, tenant membership |
| Offline | Not applicable | Reader app works a full route-day offline, syncs deltas |
| Proof | Screenshots + browser tests | Migrations + RLS tests + ledger invariants + audits |

Rule: **never import demo code into root, never point root at demo
data, never demo with the real API.** A change in one must not require
a change in the other. CI enforces the demo side; the dev manual
enforces the MajiBill side.

## 2. Why we keep both (and why they stay separate)

1. **A pitch cannot wait for a platform.** The demo runs with zero
   backend so a sale never depends on Docker, credentials or Wi-Fi.
2. **A ledger cannot live in a browser.** Real money needs
   transactions, row-level security, append-only audit and backups —
   none of which localStorage can promise. Mixing them would let demo
   shortcuts leak into money paths.
3. **Different blast radii.** Breaking the demo ruins a meeting;
   breaking MajiBill corrupts bills. Separate runtimes, ports,
   databases, compose projects and test suites keep failures local.
4. **Different review bars.** Demo changes need speed + story;
   MajiBill changes need SDR coverage, matrix/RLS/ledger tests and a
   migration rehearsal. One bar for both would slow the pitch or
   weaken the platform.
5. **Clean handover.** When MajiBill replaces the demo narrative, the
   demo retires by deleting one folder — no untangling.

## 3. Host each separately

### Demo (pitch laptop, no Docker)

```bash
npm install
npm run dev            # Vite :3000, fictional data, no credentials
```

Optional legacy API mode (`npm run api`, :4000 with `DATABASE_URL`)
is presenter-only and still fictional data. Never expose it.

### MajiBill (dev machine, Docker required)

```bash
cp -n .env.example .env     # once; set POSTGRES_PASSWORD
docker compose up -d        # majibill-postgres :5434 + majibill-redis :6381
DATABASE_URL=postgres://majibill:<pw>@127.0.0.1:5434/majibill node db/migrate.js
npm run dev:api             # core API :4000  (or --profile app for the container)
```

Full command reference: [dev manual](DEV-MANUAL.md).
Port map: demo Vite :3000 · MajiBill API :4000 · MajiBill Postgres
:5434 · MajiBill Redis :6381. Griot's 5433/6380 and the defaults are
never touched.

## 4. Where work goes (Griot-style layers)

MajiBill mirrors the proven Griot layering so Baseline can architect
each slice cleanly:

```text
apps/api/src/
  {identity,customers,accounts,readings,billing,payments,webhooks}/
    *.controller.ts   # thin: validate (Zod), authn/z, call one use case
    *.service.ts      # use case: one transaction, domain first
    domain/           # pure: tariff math, allocation, policy (no I/O)
    *.dto.ts          # contract, generated into packages/contracts
  shared/db/          # pool, tenant context, RLS guard, migrations runner
  shared/auth/        # sessions, OTP/TOTP, can() policy wiring
  shared/policy/      # RBAC matrix (the test oracle)
packages/domain/      # tariff + policy shared with web/reader
packages/contracts/   # OpenAPI 3.1 source → generated TS/Expo clients
packages/ui/          # DataTable, MoneyInput, StatusBadge … (next slice)
packages/config/      # eslint/tsconfig/prettier, one rule everywhere
db/migrations/        # plain SQL, expand/contract, rehearsed on a copy
docs/system-design/   # SDR-001..010 + register (merged = approved)
docs/specs/majibill/  # one spec per slice, one branch per spec
docs/trackers/        # per-area live task lists + evidence
project-kit/          # brief, environments, commands, conventions
```

Rules (same as Griot): controllers thin; domain pure; every tenant
table has `tenant_id` + forced RLS + composite keys; tenant id comes
from the session, never the body; audit row in the same transaction;
idempotency key on every retryable write; no new language without an
ADR.

## 5. Definition of done per side

- **Demo:** `npm run build && npm test && npm run test:e2e` green.
- **MajiBill:** `npm run build:production && npm run test:production`
  green, migrations apply on a fresh container, RLS catalog clean,
  new matrix cells tested, `docker compose config -q` clean.

## 6. Area gates (Griot-style: verify before trusting)

| Area | Path | Gate | Tracker |
|---|---|---|---|
| demo | `demo-app` | `npm run build && npm test && npm run test:e2e` | `docs/trackers/demo.md` |
| api | `apps/api` | `npm run build --workspace @majibill/core-api` | `docs/trackers/api.md` |
| web | `apps/web` | `npm run build --workspace @majibill/staff-web` | `docs/trackers/web.md` |
| reader | `apps/reader` | `npm run test:production` (Expo verify on slice) | `docs/trackers/reader.md` |
| domain | `packages/domain` | `npm run test:production` | `docs/trackers/api.md` |
| db | `db` | fresh-container migrate + RLS catalog query | `docs/trackers/api.md` |
| infra | repo root | `docker compose config -q` | `docs/trackers/infra.md` |
| root | `.` | `git diff --check` + all area gates | `docs/trackers/root.md` |
