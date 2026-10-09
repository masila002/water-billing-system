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
- `frontend/` - web dashboard and customer portal
  - `src/app/` - pages or routes
  - `src/components/` - shared UI blocks
  - `src/features/` - domain-specific views
  - `src/lib/` - utilities
  - `src/styles/` - CSS and themes
  - `public/` - static assets
- `shared/` - shared types and constants
- `database/` - schema, migrations, seed data
- `docs/` - implementation notes and project docs

## Database

The initial PostgreSQL schema and fictional demo records are in [database/](./database/). See [database/README.md](./database/README.md) for Neon setup, migration instructions, tenant context, and current demo limitations. Keep connection credentials in a local `.env` file; `.env` is ignored by Git.

## Initial goal
Build a simplified demonstration of the real MajiBill product: customer onboarding, meter readings, billing, payment recording, and dashboard reporting.

## Next steps
1. Configure a rotated Neon connection URL locally.
2. Apply and verify the initial schema and demo seed data.
3. Run the NestJS API in `backend/`.
4. Build the dashboard UI and connect it to the API.
