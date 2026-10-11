# MajiBill application

Start from the [repository README](../README.md). The root npm workspace installs and runs the existing frontend/backend packages together.

- `frontend/`: Vite operations UI, local demo engine and domain tests.
- `backend/`: retained NestJS/PostgreSQL integration; local fictional data only.
- `database/`: retained SQL schema and seed; not required by local demo mode.
- `shared/`: constants and record types.

Run `npm run demo` from the repository root for the complete local pitch demo. See the [demo runbook](../docs/DEMO-RUNBOOK.md).

## Standalone (this folder)

```bash
npm run demo              # from repo root → Vite :3000
npm run demo:build        # from repo root → builds demo only
npm run demo:test         # from repo root → 13 domain tests
npm run demo:e2e          # from repo root → browser suite (:3100)
```
