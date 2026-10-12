# MajiBill demo API

The API is a NestJS service using PostgreSQL through `pg`. It expects the database schema in `../database/schema/001_initial.sql` to be applied first.

## Start locally

1. Copy `.env.example` to `.env` inside `demo-app/` (never the root `.env`).
2. Put a fictional/demo `DEMO_DATABASE_URL` in `demo-app/.env`. The demo refuses to boot against the real database (`:5434`, `/majibill`). Keep `.env` local and do not commit it.
3. From this directory, install and start:

   ```powershell
   npm install
   npm run start:dev
   ```

The API listens on `127.0.0.1:4001` by default (never the real API's `:4000`). `HOST` may be set explicitly for a separately secured deployment. Environment variables supplied by the process take precedence; `demo-app/.env` is loaded by file path. The root `.env` is never read.

## Routes

All routes except health require an `X-Tenant-ID` UUID header. Use the demo tenant UUID `11111111-1111-4111-8111-111111111111` after loading the seed data.

- `GET /api/health`
- `GET /api/dashboard`
- `GET, POST /api/customers`
- `GET, POST /api/accounts`
- `GET, POST /api/readings`
- `GET /api/bills`
- `POST /api/bills/generate`
- `GET, POST /api/payments`

Request bodies are validated; unknown properties are rejected. Every tenant-scoped request opens a transaction, sets PostgreSQL's transaction-local `app.tenant_id`, and releases the connection after commit or rollback.

## Demo-only security boundary

The `X-Tenant-ID` value is not authenticated. The API does not yet implement user sign-in, session/token validation, or role-based authorization; therefore it is only suitable for local demonstrations with fictional data. Add verified identity and tenant-membership authorization before exposing it to clients or real data.
