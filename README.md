# MajiBill

A working water-billing pitch demo, **powered by [404HubSpot](https://404-hub-spot.vercel.app/)**. Register a customer, connect a meter, capture a reading, issue a bill, record simulated payments, and follow the balance through reports and receipts.

## Run the demo

Requires Node.js 22+ and npm. From this repository:

```bash
npm install
npm run dev
```

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

## Verify

```bash
npm run build                  # Vite frontend + TypeScript NestJS backend
npm test                       # Financial, role and persistence regressions
npx playwright install chromium # First browser test setup
npm run test:e2e                # Complete journey + mobile + failure recovery
```

Browser evidence is generated under `test-results/` (ignored by Git). The root npm workspace and lockfile are authoritative; run installation from this directory.

## Pull request reviews

The repository includes [CodeRabbit configuration](.coderabbit.yaml) for automatic, balanced reviews of non-draft pull requests, including guidance for tenant isolation and financial correctness. To activate it, an owner must connect the repository to the [CodeRabbit GitHub App](https://github.com/apps/coderabbitai). Disable or uninstall Sourcery for this repository in GitHub's installed-app settings to avoid duplicate reviews. GitHub Actions continues to run builds and tests separately.

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

The existing NestJS/PostgreSQL path is retained. See [API setup](demo-app/backend/README.md) and [database setup](demo-app/database/README.md). Start it with `npm run api`, then choose **Local API integration** in workspace settings. That mode retains customer/bill/account/payment lists and existing customer/payment forms. New demo-only workflow controls remain in local demo mode until the backend contract is expanded and verified.

The API trusts a supplied tenant header and has no authenticated identity or role enforcement. Use fictional local data only. Database integration is not covered by the browser demo tests. No public deployment is configured or performed.
