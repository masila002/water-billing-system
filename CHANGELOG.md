# Changelog

## Unreleased

- Added isolated backend verification: `npm run test:integration` proves the NestJS API and PostgreSQL schema against a disposable loopback database (23 checks: supported money path, tenant isolation, replays, payment race, rollback, negative cases).
- Added a CI integration job running the same suite; it fails when Docker is unavailable and never skips silently.
- Characterized, not repaired: backdated chained readings pass; overlapping bill periods pass; meter numbers are not unique; list responses carry no computed balances; payment references are unique per method.
- Fixed timezone-sensitive bill replay: identical replays compared DATE columns through local-time construction and wrongly returned 409 on runtimes east of UTC; replay now compares ISO calendar-day text. The integration suite runs under UTC and Africa/Nairobi in CI.

- Added GitHub Actions verification for pull requests and `main`: locked dependency installation, both application builds, domain tests and Chromium browser tests on Node.js 22.
- Added bounded CI runs, pinned actions, read-only repository permissions and failure diagnostics retained for seven days.

## 0.2.0 — 2026-10-11

- Completed the local water-billing demo from customer registration through payment receipt.
- Added explicit browser demo mode, fictional records, demo personas, readings, bill issuance, reports, CSV exports and printable documents.
- Added precise money calculation, duplicate protection, remaining balances and storage error recovery.
- Retained the existing Vite/NestJS/PostgreSQL structure and added root install/build/test commands.
- Added 404HubSpot attribution and the seven-minute pitch runbook.
- Verified 13 domain tests, 5 browser scenarios and both application builds. Database runtime and production integration remain separate work.
