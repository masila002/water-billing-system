# Scope 02 — MajiBill identity slice (sessions, RBAC, manifest)

Status: proposed
SDRs: SDR-002 (R1-R4), SDR-003 (R1-R3)
Delivery style: skateboard (auth works alone, others plug in)
Default depth: beta

## Who it is for
Every MajiBill user and every client: login once, act within
tenant + role everywhere (web, reader, MCP, workers).

## Release 1 includes
| Feature | Why now | Depends on | Depth | Already built |
|---|---|---|---|---|
| F12 email+password login, Argon2id, rotating sessions | nothing works without identity | users/memberships tables | beta | schema only |
| F13 TOTP for staff admins, phone OTP path stubbed | SDR-002 A1 MFA requirement | F12 | beta | nothing |
| F14 RBAC enforcement: can() wired into guards + manifest | UI hides, API enforces | domain policy | beta | domain can() |
| F15 tenant scoping: session → membership, RLS policies | F1/F3 failure-list core | F12 | beta | RLS forced, no policies yet |

## Acceptance criteria
### F12 sessions
- F12-AC1 login with valid credentials returns access (≤15min) + rotating refresh
- F12-AC2 wrong password → 401, no user enumeration signal
- F12-AC3 logout revokes refresh; reuse of revoked token → 401
- F12-AC4 rate limit + lockout on 5 bad attempts
### F13 MFA/OTP
- F13-AC1 tenant admin enrolls TOTP, login challenges second factor
- F13-AC2 customer phone-OTP path stubbed behind flag (no SMS sent in dev)
### F14 RBAC + manifest
- F14-AC1 `GET /v1/me/manifest` returns permissions + scope + perm_v
- F14-AC2 reader calling bill:issue → 403; cashier calling tariff:manage → 403
- F14-AC3 permission change bumps perm_v, clients re-fetch
### F15 tenant isolation
- F15-AC1 tenant id never accepted from body/query; session only
- F15-AC2 RLS policies on all tenant tables; app role not owner/BYPASSRLS
- F15-AC3 two-tenant probe: 0 rows leak; no-context connection: 0 rows

## Explicitly excluded
SSO/OIDC adapter (per-tenant trigger), passkeys, break-glass console
(beyond read-only stub), customer self-registration.

## Deferred, and the trigger that brings each back
| Item | Trigger |
|---|---|
| Keycloak/OIDC per tenant | first SSO contract |
| Passkeys | device-fleet readiness |
| SMS OTP live send | pilot SMS account |

## Open decisions
None — resolved in spec 02 §13.
