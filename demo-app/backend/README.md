# MajiBill demo API

The API is a NestJS service using PostgreSQL through `pg`. It expects the database schema in `../database/schema/001_initial.sql` to be applied first.

## Start locally

1. Copy `../.env.example` to `../.env`.
2. Replace the placeholder `DATABASE_URL` with a rotated Neon URL. Keep `.env` local and do not commit it.
3. From this directory, install and start:

   ```powershell
   npm install
   npm run start:dev
   ```

The API listens on port `4000` by default. Environment variables supplied by the process take precedence; when `../.env` exists it is loaded for local development.

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
