# AGENTS.md — MajiBill MCP server (alpha scaffold)

Agent tools over the API only (on-behalf-of a person, so RLS
applies). No direct database access, ever. Tools: readings submit,
bill read, payment status, manifest — each tenant-scoped + audited.
Gate: `npm run typecheck --workspace @majibill/mcp`.
Tracker: `docs/trackers/api.md` (MCP section).
