# AGENTS.md — MajiBill AI workers (alpha scaffold)

Jobs wrap the API on-behalf-of a person or schedule (bill runs, SMS
batches, exports, dunning). Idempotent, bounded retries, dead-letter
path. No direct database access, no OTP/auth/delete powers.
Gate: `npm run typecheck --workspace @majibill/ai-workers`.
Tracker: `docs/trackers/api.md` (workers section).
