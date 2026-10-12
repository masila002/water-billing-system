# Conventions — MAJIBILL (layer rules)

- Controllers thin: validate (Zod), authn/z, call exactly one use case.
- Services own the transaction; domain is pure (no I/O, no HTTP, no SQL).
- Money is `bigint` minor units + `KES`; rates `numeric(12,4)`.
- Every tenant table: `tenant_id`, composite FKs, RLS enabled + forced.
- Tenant id from session + membership, never the request body.
- Audit row in the same transaction as the change; append-only enforced.
- Idempotency keys on every retryable write; webhooks verified + replayable.
- Cursor pagination everywhere (created_at + id), default 25, max 100.
- One error envelope: code, message, traceId. No PII or tokens in logs.
- TS strict; SQL reviewed; no new language without an ADR.
- Demo code never imported into root; root never reads demo data.
