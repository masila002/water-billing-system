# MajiBill Demo App

This folder contains the starter structure for the MajiBill water billing demo.

## Structure

- `backend/` - API server and business logic
  - `src/controllers/` - route handlers
  - `src/services/` - billing, payments, readings logic
  - `src/routes/` - API route definitions
  - `src/middleware/` - auth, validation, errors
  - `src/config/` - environment and config
  - `src/utils/` - helper logic
  - `tests/` - backend tests
- `frontend/` - Vite operations dashboard connected to the API
  - `src/app/` - application startup, state, and workspace shell
  - `src/components/` - shared dialog, icon, table, and toast UI
  - `src/features/` - dashboard, record views, and customer/payment forms
  - `src/lib/` - API access and display formatting
  - `src/styles/` - global dashboard styles
  - `public/` - static browser assets
- `shared/` - shared API data contracts and demo constants
- `database/` - schema, migrations, seed data
- `docs/` - implementation notes
- `docs/` - implementation notes and project docs

## Database

The initial PostgreSQL schema and fictional demo records are in [database/](./database/). See [database/README.md](./database/README.md) for Neon setup, migration instructions, tenant context, and current demo limitations. Keep connection credentials in a local `.env` file; `.env` is ignored by Git.

## Initial goal
Build a simplified demonstration of the real MajiBill product: customer onboarding, meter readings, billing, payment recording, and dashboard reporting.

## Next steps
1. Copy `.env.example` to `.env` and add a rotated Neon connection URL. Never commit or share `.env`.
2. From this directory, apply `database/schema/001_initial.sql` and then `database/seed/demo_seed.sql` as documented in [database/README.md](./database/README.md). The seed is for an empty demo database only.
3. In `backend/`, run `npm install` and `npm run start:dev`.
4. In `frontend/`, run `npm install` and `npm run dev`, then open `http://localhost:3000`. The dashboard's API URL and tenant ID can be changed with the settings button.
