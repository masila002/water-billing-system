# Commands — MAJIBILL

Every command runs from the repo root. Rows marked with a date were
executed; anything else is UNVERIFIED.

| Area | Purpose | Command | Verified |
|---|---|---|---|
| infra | start stores | `docker compose up -d` | 2026-10-11 up, both healthy |
| infra | syntax | `docker compose config -q` | run before every push |
| db | migrate | `DATABASE_URL=... node db/migrate.js` | 2026-10-11 applied 001+002a+002b, 16 tables |
| api | build | `npm run build --workspace @majibill/core-api` | 2026-10-11 exit 0 |
| api | dev | `npm run dev:api` (needs DATABASE_URL) | 2026-10-11 :4000 health ok |
| domain | test | `npm run test:production` | 2026-10-11 9/9 pass |
| demo | build | `npm run build` | pre-push gate |
| demo | test | `npm test` | pre-push gate, 13/13 |
| demo | browser | `npm run test:e2e` | needs Chromium |
| demo | integration | `npm run test:integration` | needs Docker |
