# MajiBill dev manual — spin up every server yourself

Every command runs from the repo root unless stated. Node 22+,
Docker, `psql`/`redis-cli` clients assumed. Env var NAMES only;
values live in your git-ignored `.env`.

## 0. First time (once)

```bash
cp -n .env.example .env        # then set POSTGRES_PASSWORD in .env
npm install                    # root workspace (demo + MajiBill)
docker compose up -d           # majibill-postgres :5434, majibill-redis :6381
DATABASE_URL=postgres://majibill:<pw>@127.0.0.1:5434/majibill node db/migrate.js
```

Verify: `docker compose ps` shows both `healthy`;
`pg_isready -h 127.0.0.1 -p 5434` accepts;
`redis-cli -p 6381 ping` returns `PONG`;
`GET http://127.0.0.1:4000/v1/health` returns service JSON
(after §1 or §2).

## 1. Everyday loop (recommended: API on your machine)

```bash
docker compose up -d                       # stores only
DATABASE_URL=postgres://majibill:<pw>@127.0.0.1:5434/majibill \
REDIS_URL=redis://127.0.0.1:6381 \
npm run dev:api                            # core API → :4000, hot reload
```

Staff web and reader shells run separately when their slices land;
today they are static shells (`apps/web`, `apps/reader`).

## 2. Full stack in containers (parity check)

```bash
docker compose --profile app up -d --build  # adds majibill-api :4000
docker compose ps                            # api healthy via /v1/health
docker compose logs -f majibill-api          # tail the API
docker compose --profile app down            # back to stores-only
```

## 3. Database work (SQL-first, Griot-style)

```bash
# Apply migrations in order (idempotent per file, forward-only)
DATABASE_URL=postgres://majibill:<pw>@127.0.0.1:5434/majibill node db/migrate.js

# Inspect
PGPASSWORD=<pw> psql -h 127.0.0.1 -p 5434 -U majibill -d majibill -c '\dt'
PGPASSWORD=<pw> psql -h 127.0.0.1 -p 5434 -U majibill -d majibill \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity = false;"

# Fresh start (DEV ONLY — destroys the local volume, never prod)
docker compose down -v
docker compose up -d
DATABASE_URL=... node db/migrate.js
```

New tenant table → add `tenant_id`, composite keys, `ENABLE ROW LEVEL
SECURITY` + `FORCE`, policy in the auth slice, and a two-tenant
negative test. Migrations are plain SQL, expand/contract, rehearsed
on a copy before they touch shared environments.

## 4. Verify gates (run before every push)

```bash
npm run build:production     # core-api tsc + domain tsc
npm run test:production      # domain tariff/RBAC suite (9 tests)
npm run build                # demo frontend + backend untouched
npm test                     # demo domain suite (13 tests)
docker compose config -q     # compose syntax clean
git diff --check             # whitespace clean
```

Browser + integration suites: `npm run test:e2e`,
`npm run test:integration` (disposable containers, needs Docker).

## 5. Stop, wipe, rebuild

```bash
docker compose stop                    # pause, keep data
docker compose down                    # remove containers, keep volumes
docker compose down -v                 # DESTROYS local pgdata — dev only
docker compose up -d && DATABASE_URL=... node db/migrate.js   # rebirth
```

Griot's `griot-*` containers (5433/6380) and the old `docker_*`
project are unrelated — leave them running.

## 6. Port map (never collide)

| Server | URL | Source |
|---|---|---|
| Demo Vite | http://127.0.0.1:3000 | `npm run dev` |
| MajiBill API | http://127.0.0.1:4000 | `npm run dev:api` / compose `app` |
| MajiBill Postgres | 127.0.0.1:5434 | `majibill-majibill-postgres-1` |
| MajiBill Redis | 127.0.0.1:6381 | `majibill-majibill-redis-1` |
| Griot Postgres | 127.0.0.1:5433 | other project, do not stop |
| Griot Redis | 127.0.0.1:6380 | other project, do not stop |

## 7. Troubleshooting

- `POSTGRES_PASSWORD:?` error → you forgot `cp .env.example .env`.
- `:5434 accepted` but migrate fails → check `DATABASE_URL` password
  matches `.env`; `docker compose logs majibill-postgres`.
- API `:4000` silent → `PORT/HOST` env; `dist/` rebuilt?
  (`npm run build --workspace @majibill/core-api`).
- Stale `docker_postgres` containers → `docker compose -f
  infra/docker/compose.yaml down`; the old path is retired.
- `npm install` ENOTEMPTY → kill duelling installs, `rm -rf
  node_modules/.<pkg>-*`, reinstall once.
