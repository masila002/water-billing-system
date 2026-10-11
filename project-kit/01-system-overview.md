# System overview — MAJIBILL

NestJS modular monolith → Postgres 16 (RLS forced) + Redis/BullMQ.
Next.js staff console (reference client). Expo React Native reader
(offline-first, SQLite outbox, delta sync). REST + OpenAPI 3.1 under
`/v1`. Money: Daraja C2B inbox → posting worker → balanced ledger →
FIFO allocation. Identity: Argon2id sessions, TOTP, RBAC matrix, tenant
from session. One artifact, three cells: pooled default, silo and
sovereign on demand. See `docs/system-design/SDR-001-overview.md`.
