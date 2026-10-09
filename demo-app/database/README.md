# Demo database

The demo uses PostgreSQL and stores currency amounts as integer minor units (for KES, cents). Tenant-owned records carry a `tenant_id`; composite foreign keys prevent records from different tenants from being linked.

## Files

- `schema/001_initial.sql` creates the demo tables, indexes, constraints, audit immutability trigger, and tenant row-level security policies.
- `seed/demo_seed.sql` adds fictional demo data for one utility, including accounts, a reading, bills, and a partial M-Pesa payment.

## Connect

Copy `.env.example` to `.env` and put the rotated Neon connection URL in `DATABASE_URL`. Do not commit `.env` or share its contents. Keep the connection URL in a secret manager for deployed environments.

Apply the schema and sample data from PowerShell using `psql`:

```powershell
$env:DATABASE_URL = "your Neon connection URL"
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f .\database\schema\001_initial.sql
psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -f .\database\seed\demo_seed.sql
```

Run these commands from the `demo-app` directory. The seed script is intended for an empty demo database; it is not idempotent.

## Tenant context

Before querying tenant-scoped tables, the application must set the tenant context within the same database transaction as its queries:

```sql
BEGIN;
SELECT set_config('app.tenant_id', $1, true);
-- Run tenant-scoped queries here using parameterized SQL.
COMMIT;
```

The `true` argument makes the setting transaction-local, which avoids leaking a tenant context through pooled connections. A missing context returns no tenant rows under the RLS policies. Production use still requires a non-owner application database role, authorization checks, migration review, and tests proving tenant isolation.

The demo API receives the tenant UUID from the `X-Tenant-ID` request header. This is a demo-only tenant selector, not authentication or authorization. Do not expose the API to untrusted users until the header is derived from a verified identity and tenant membership.

## Scope and limitations

This is a demo schema, not a production accounting implementation. Payment allocations support partial settlement, but the demo does not yet include a double-entry ledger, automated tariff calculation, payment-provider callbacks, user credential management, or the full append-only hash-chained audit design from the project briefs.
