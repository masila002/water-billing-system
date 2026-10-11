# Scope 03 — root takeover: MajiBill owns root, demo owns demo-app/

Status: approved
SDRs: SDR-001 §6 (contracts), SDR-007 (stack), SDR-009 (deploy)
Delivery style: facade (root commands reroute, nothing breaks)
Default depth: beta

## Who it is for
Engineers running the repo daily: bare `npm run dev/build/test`
must serve MajiBill; the demo stays one explicit command away.

## Release 1 includes
| Feature | Why now | Depends on | Depth | Already built |
|---|---|---|---|---|
| F16 root scripts serve MajiBill; demo scripts namespaced | operator: real app takes over root | layers merged | beta | root serves demo |
| F17 apps/web runnable (layout, config, tsconfig) | missing entry is the reported bug | Next 16 installed | beta | shell page only |
| F18 dev:infra names match compose services | current names don't exist, command fails | root compose | beta | wrong names |
| F19 demo self-contained: its own scripts + docs path | demo must run from demo-app/ alone | demo pkgs | beta | root-routed |
| F20 CI + guides updated to new command map | gates must test what engineers run | F16-F19 | beta | old map |

## Acceptance criteria
### F16 root takeover
- F16-AC1 `npm run dev` starts staff web (:3001) NOT the demo
- F16-AC2 `npm run build` builds core-api + domain + staff-web
- F16-AC3 `npm run test` runs production domain suite (14 tests)
- F16-AC4 `npm run demo` / `demo:build` / `demo:test` / `demo:e2e` reproduce old demo flows exactly
- F16-AC5 no bare root script touches demo-app/ except via `demo:*`
### F17 staff web runnable
- F17-AC1 `npm run dev --workspace @majibill/staff-web` serves :3001 with MajiBill shell
- F17-AC2 `npm run build --workspace @majibill/staff-web` exits 0
### F18 infra names
- F18-AC1 `npm run dev:infra` starts majibill-postgres + majibill-redis (real service names)
### F19 demo self-contained
- F19-AC1 `cd demo-app && npm run dev` equivalent works from demo-app/ (documented path)
- F19-AC2 demo ports/commands unchanged (:3000, :3100 e2e)
### F20 docs + CI
- F20-AC1 TEAM-GUIDE/DEV-MANUAL/project-kit commands match new map
- F20-AC2 CI verifies production gates + demo gates on every PR

## Explicitly excluded
Staff web business logic (slices do that); reader entry changes;
removing demo-app/ (it stays, namespaced).

## Deferred, and the trigger that brings each back
| Item | Trigger |
|---|---|
| `npm start` prod server | first deploy slice |
| Reader `dev` root shortcut | readings slice |

## Open decisions
None — resolved in spec 03 §13.
