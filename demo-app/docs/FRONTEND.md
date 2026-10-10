# Frontend structure

The Vite dashboard is organized by responsibility:

- `frontend/src/app/` owns application startup, state, and the workspace shell.
- `frontend/src/components/` contains shared HTML renderers for dialogs, icons, and tables.
- `frontend/src/features/` contains dashboard, register, and workflow-specific views.
- `frontend/src/lib/` contains API access and display formatting helpers.
- `frontend/src/styles/` contains the global dashboard stylesheet.
- `frontend/public/` contains static browser assets such as the favicon.
- `shared/` contains the demo tenant/configuration constants and API data contracts.

Run the dashboard from `frontend/` with `npm run dev`. It uses the API at
`http://localhost:4000/api` and the demo tenant UUID by default; both can be
changed through the API settings dialog.