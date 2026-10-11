# MajiBill application

Start from the [repository README](../README.md). The root npm workspace installs and runs the existing frontend/backend packages together.

- `frontend/`: Vite operations UI, local demo engine and domain tests.
- `backend/`: retained NestJS/PostgreSQL integration; local fictional data only.
- `database/`: retained SQL schema and seed; not required by local demo mode.
- `shared/`: constants and record types.

Run `npm run dev` from the repository root for the complete local pitch demo. See the [demo runbook](../docs/DEMO-RUNBOOK.md).
