# Spec majibill/02 — identity slice (auth, RBAC, manifest, RLS)

Status: Proposed
Depth: beta
Scope: docs/scope/02-identity.md#F12-F15
SDRs: SDR-002/R1-R4, SDR-003/R1-R3
Branch: feature/production/04-identity
Lockstep: none

## 1. Outcome and acceptance criteria
Scope 02 F12-AC1..F15-AC3 (12 checks). After this slice a user logs
in, holds a tenant-scoped session, sees only permitted actions, and
no tenant leaks at API or DB level.

## 2. Contract and consumers
- POST /v1/auth/login {email, password, tenantSlug?} → {access, refreshExpires, mfaRequired}
- POST /v1/auth/refresh {refresh} → rotated pair; reuse → 401 + revoke chain
- POST /v1/auth/logout {refresh} → revoked
- POST /v1/auth/totp/enroll + /v1/auth/totp/verify (staff admin)
- GET /v1/me/manifest → {tenant, user, roles, permissions, scope, perm_v}
- Consumers: staff web (session cookie + bearer), reader (secure-store
  refresh), MCP/AI (service token OBO, same policy).

## 3. Data changes
Migration 003_auth.sql: sessions(id, user_id, tenant_id, refresh_hash,
expires_at, revoked_at, ip, agent), totp_secrets(user_id, secret_enc,
verified_at), login_attempts(email, ip, at, ok). RLS policies:
tenant_isolation on all tenant tables USING/WITH CHECK
(tenant_id = current tenant); memberships join for user rows.
Reversible: drop policies + tables in down file; rehearsed on copy.

## 4. Authorization matrix
Same as spec 01 §4 (matrix-T1..T6), now enforced in guards +
per-object checks. Support impersonation: read-only + banner +
audit (SDR-002/R4).

### 4.1 Security, audit, observability and scale
| Item | This feature |
|---|---|
| Permissions | F14 matrix; can() single policy module |
| Object checks | membership lookup per request; id reads verify tenant |
| Tenant data | policies on 15 tables; set_config per txn; jobs carry tenant |
| Audit events | auth.login ok/failed, logout, refresh_reuse, role.grant, impersonate |
| Log/trace | auth events with ids only; alerts: 401/403 spike, reuse, grants |
| Scale | sessions indexed (user, expires); auth 10/min/IP; primary reads |
| Proof tests | matrix, two-tenant, RLS catalog, revocation, log hygiene |

## 5. Value-source table
| Value | Source | Owner | Freshness | Failure behaviour |
|---|---|---|---|---|
| Identity | session + membership join | identity | per request | 401 |
| Permissions | RBAC matrix + perm_v | policy | per request | deny closed |
| Tenant scope | membership tenant_id | identity | per request | zero rows |
| MFA state | totp_secrets verified_at | identity | login | challenge |

## 6. Pagination, limits, access rate
Auth 10/min/IP + 5-strike lockout + backoff. Manifest cached
client-side until perm_v bump. Session list paginated 25/100.
## 7. Failure modes and edge cases
Refresh reuse → revoke chain + alert (theft signal). Clock skew →
leeway 30s, reject beyond. Tenant suspended → login ok, writes 403
entitlement. Concurrent role revoke → perm_v bump, live sessions
re-evaluated per request. Pool leak → set_config local-only + tests.

## 8. UI states
Login: loading, error (invalid credentials — same copy for unknown
user), locked-out with retry-after, MFA challenge, success redirect.
Manifest load failure → error with retry; offline → error (no cached
permissions for writes; reads show stale badge).

## 9. External APIs
| Library / provider | Pinned version | Doc reference | Status | Date |
|---|---|---|---|---|
| argon2 (npm) | VERIFY at install | https://github.com/ranisalt/node-argon2 | UNVERIFIED | 2026-10-11 |
| otplib | VERIFY at install | https://github.com/yeojz/otplib | UNVERIFIED | 2026-10-11 |
| SMS gateway | operator supplies | tenant contract | UNVERIFIED | 2026-10-11 |

## 10. Reuse list
Searched: demo-app (no real auth — persona facade, explicitly not
reused); domain can() — reused as policy oracle; demo RLS middleware
(header tenant) — replaced by session+membership (F1 fix).

## 11. Uniformity
Guards on every controller; per-object check helper in shared/policy;
session middleware sets tenant once per request; same envelope +
401/403 copy in web + reader + MCP.

## 12. Test and verify plan
| AC id | Verify step | Automated test | Authz-negative test |
|---|---|---|---|
| F12-AC1..AC4 | login/refresh/logout/lockout curl | api auth suite | enumeration probe |
| F13-AC1/AC2 | TOTP enroll+challenge; OTP stub flag | totp vectors | bypass attempt 403 |
| F14-AC1..AC3 | manifest shape; forbidden calls; perm bump | matrix tests | cross-role 403s |
| F15-AC1..AC3 | body-tenant rejected; catalog; two-tenant | RLS + probe suites | IDOR by id → 404 |

## 13. Decisions
| ID | Options | Chosen | Rejected + reason | Register row |
|---|---|---|---|---|
| I-01 | sessions vs JWT-only | rotating server sessions | JWT-only: revocation gap (F8) | D-025 |
| I-02 | MFA now vs later | TOTP staff now, OTP stubbed | later: SDR-002 requires admin MFA | D-026 |
| I-03 | policy location | shared can() module | per-controller strings: drift | D-027 |
| I-04 | tenant source | session+membership | body/query: F1 exploitable | D-028 |

## 14. Rollback
Feature-flagged routes; down migration drops policies/tables; revoked
sessions stay revoked (re-login required). No money writes yet.

## 15. Open assumptions
ASSUMPTION(A-01..A-03) carried from spec 01. No new business rules.
