# MajiBill

**`MAJIBILL`** — the real multitenant water-billing platform. This root is the
product; `demo-app/` is the pitch demo. They share nothing at runtime.

- **Team start:** [Team guide](docs/TEAM-GUIDE.md) (demo vs real, why split,
  how to host each) → [Dev manual](docs/DEV-MANUAL.md) (spin up everything)
  → [Production map](docs/PRODUCTION.md) → [Decisions](docs/system-design/).
- **MajiBill (real):** `npm run dev` → staff console http://127.0.0.1:3001.
  `npm run dev:api` → core API http://127.0.0.1:4000 (needs Postgres + Redis).
  See [dev manual](docs/DEV-MANUAL.md).
- **Demo (pitch):** `npm run demo` → http://127.0.0.1:3000. No database.
  See [demo runbook](docs/DEMO-RUNBOOK.md) and [demo-app/](demo-app/README.md).

```text
apps/api/       MajiBill core API (NestJS modular monolith)
apps/web/       Staff console (Next.js)
apps/reader/    Reader field app (Expo React Native, offline-first)
packages/       Shared domain, contracts, UI, config
db/             SQL-first RLS migrations (the database contract)
docs/           Team guide, dev manual, SDRs, runbooks
project-kit/    Brief, environments, commands, conventions, risks
demo-app/       Pitch demo (Vite + NestJS + localStorage, isolated)
tests/          Browser verification for the demo
```


## Run MajiBill (the real app)

Requires Node.js 22+, npm and Docker. From this repository:

```bash
npm install
cp -n .env.example .env        # once; set POSTGRES_PASSWORD
docker compose up -d           # majibill-postgres :5434 + majibill-redis :6381
DATABASE_URL=postgres://majibill:<pw>@127.0.0.1:5434/majibill node db/migrate.js
npm run dev                    # staff console → http://127.0.0.1:3001
npm run dev:api                # core API → http://127.0.0.1:4000
```

`npm run build` builds core-api + domain + staff-web. `npm test` runs
the 14 production domain tests. Full reference: [dev manual](docs/DEV-MANUAL.md).

## Run the demo (pitch, isolated)

```bash
npm run demo                   # Vite dashboard → http://127.0.0.1:3000
```

Demo env is sealed: `demo-app/.env` (`DEMO_DATABASE_URL`, port 4001)
is the only file the demo reads — the root `.env` (real database) is
never loaded, and the demo refuses to boot against `:5434/majibill`.

Open **http://127.0.0.1:3000**, choose **Administrator**, and enter the demo workspace. No database, account, password or payment credentials are required. After dependencies are installed, the local app needs no internet access. Browser storage must be enabled.

The six fictional customers and their bills are ready for presentation. Your changes persist in this browser. **Workspace settings → Reset fictional demo data** restores the samples after confirmation. Demo roles are selectable presentation personas, not authenticated users. M-Pesa payments are simulations: no prompt is sent and no money is collected.

## What works

- Customer registration/search and unique metered service accounts.
- Cumulative readings with precision, chronology and regression checks.
- Bills with visible consumption, fixed charges, integer-cent calculations and duplicate protection.
- Partial/full simulated payments, remaining balances, unique references and safe replay handling.
- Printable bills/receipts, collections reports, CSV exports and local activity history.
- Administrator, reader, cashier and accountant demonstrations with mutation checks.
- Responsive desktop/mobile layouts, keyboard dialogs and visible error recovery.

Follow [the seven-minute pitch](docs/DEMO-RUNBOOK.md). See [architecture and limitations](docs/ARCHITECTURE.md) and [pilot readiness](docs/PILOT-READINESS.md).

## Verify (MajiBill first, demo namespaced)

```bash
npm run build                  # MajiBill: core-api + domain + staff-web
npm test                       # MajiBill domain suite (14 tests)
npm run gates                  # RLS catalog, contracts, inspo, secrets, compose
npm run demo:build             # demo frontend + backend (isolated)
npm run demo:test              # demo domain suite (13 tests)
npx playwright install chromium # First browser test setup
npm run demo:e2e               # demo journey + mobile + failure recovery
npm run test:integration        # demo legacy API vs disposable PostgreSQL (needs Docker)
```

Browser evidence is generated under `test-results/` (ignored by Git). The root npm workspace and lockfile are authoritative; run installation from this directory.

[GitHub Actions](https://github.com/masila002/water-billing-system/actions/workflows/verify.yml) runs `npm ci`, both builds, domain tests and Chromium browser tests for every pull request and push to `main`. It uses Node.js 22 on Ubuntu 24.04, with a 15-minute job limit and a five-minute browser-suite limit. A newer run for the same branch or pull request cancels the previous run. Fork pull requests may need a maintainer to approve their first workflow run.

On failure, available browser traces, screenshots and the HTML report are uploaded as `browser-failure-diagnostics` for seven days. Early installation or build failures may have no browser artifacts; use the job logs. The workflow uses a read-only repository token and requires no application secrets or database. These checks cover the local demo; they do not verify PostgreSQL integration or production readiness.

`npm run test:integration` starts a disposable `postgres:16-alpine` container on loopback, provisions a restricted application role plus the schema and a fictional two-tenant fixture, then exercises the real API: the supported customer-to-paid-bill path, tenant isolation, idempotent replays, a five-way payment race, rollback atomicity and negative validation. Only fictional `mb-test-*` records are used; the harness refuses non-loopback targets and tears down only the database and container it created. A second CI job runs the same suite against a disposable database service and fails when Docker is unavailable. Characterization findings still open (backdated readings, overlapping periods, duplicate meters, reference scope, list balance fields) are documented in the release notes below, not repaired here. Bill replay dates are timezone-safe since the F04 repair; CI runs the suite under both UTC and Africa/Nairobi.

Set `MB_TEST_TZ` (for example `Africa/Nairobi`) to run the integration suite under a non-UTC runtime; unknown zones fail loudly. CI runs the suite under both UTC and Africa/Nairobi.

## Project structure

```text
demo-app/frontend/   Vite dashboard and isolated local demo adapter
demo-app/backend/    Existing NestJS API integration
demo-app/database/   Existing PostgreSQL schema and fictional seed
demo-app/shared/     Shared constants and data types
docs/               Demo script, architecture and pilot boundary
tests/              Browser workflow verification
```

The original [demo blueprint](DEMO_BLUEPRINT.md) is retained as historical planning. This README defines the implemented demo scope; it does not imply all blueprint or research features are complete.

## Optional local database integration

The existing NestJS/PostgreSQL path is retained. See [API setup](demo-app/backend/README.md) and [database setup](demo-app/database/README.md). Start it with `npm run demo:api`, then choose **Local API integration** in workspace settings. That mode retains customer/bill/account/payment lists and existing customer/payment forms. New demo-only workflow controls remain in local demo mode until the backend contract is expanded and verified.

The API trusts a supplied tenant header and has no authenticated identity or role enforcement. Use fictional local data only. Database integration is not covered by the browser demo tests. No public deployment is configured or performed.
