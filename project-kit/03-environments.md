# Environments — MAJIBILL

Env var NAMES only. Values live in `.env` (git-ignored) or the secret
store, never in docs or commits.

| Environment | API | Data | Notes |
|---|---|---|---|
| local | :4000 via `npm run dev:api` or compose `app` | disposable compose pg :5434 | `docker compose up -d` |
| staging | container host | managed Postgres + Redis | parity seed, migration rehearsal |
| production | container host, WAF, on-call | managed Postgres PITR + replica | pooled cell; silo/sovereign same image |

| Variable name | Used by | local | staging | production |
|---|---|---|---|---|
| POSTGRES_USER / PASSWORD / DB | compose, migrate, API | .env | secret store | secret store |
| DATABASE_URL | API, migrate.js | 127.0.0.1:5434 | managed host | managed host |
| REDIS_URL | API, workers | 127.0.0.1:6381 | managed | managed |
| PORT / HOST | API | 4000 / 127.0.0.1 | 4000 / 0.0.0.0 | 4000 / 0.0.0.0 |
