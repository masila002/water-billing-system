# AGENTS.md — MajiBill QA harness

Proves the platform: RBAC matrix, two-tenant negatives, RLS catalog,
audit append-only, ledger invariants — all against disposable
containers. Mocks never prove isolation. Gate: per-suite green,
recorded in `docs/trackers/api.md`.
