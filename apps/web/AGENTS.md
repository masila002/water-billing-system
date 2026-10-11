# AGENTS.md — MajiBill staff web (Next.js 16)

Reference client for office workflows. Reads the permission manifest;
UI hides, API enforces. Every screen defines loading, empty (5
distinct), error, denied states before build.

Stack: Next.js 16.4.0, React 19, Tailwind 4, shadcn/ui.
Gate: `npm run build --workspace @majibill/staff-web`.
Tracker: `docs/trackers/web.md`. Spec: `docs/specs/majibill/01-layers.md` (F02).
