# Frontend

Vite serves the operations UI. `src/app/main.js` orchestrates session, navigation and forms. `src/lib/api.js` chooses explicit local demo or existing API. `src/lib/demo-store.js` persists fictional state and validates role permissions and financial invariants; `src/lib/billing.js` provides exact currency rounding.

The default local demo requires no database. Extra views are meter readings, reports and activity. Existing customer/payment forms and shared components are reused. In optional API mode those extra views/actions are hidden until API contracts support them.

Use the root commands `npm run dev`, `npm run build`, `npm test` and `npm run test:e2e`. Contracts are described in `../shared/types.d.ts`; pilot gaps and security boundaries are in the root documentation.
