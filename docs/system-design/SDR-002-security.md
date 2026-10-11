# SDR-002 — security (authn, RBAC, isolation)

Status: proposed
Owner: operator
Depends on: SDR-001
KB refs: Secure-by-design; Auth guide; Tenancy §5-6, §10

## Decision summary
In-house identity on proven libs; short sessions; deny by
default matrix; tenant from session+membership; RLS forced.

## Options considered
| Option | Fit | Cost | Risk | KB position |
|---|---|---|---|---|
| In-house module | residency, MAU cost, tenant RBAC | own surface | med, libs+tests | allowed w/ checklist |
| Clerk/Auth0 | fast, hosted | MAU fees, residency | low | house default SaaS |
| Keycloak everywhere | SSO native | ops heavy | med | per-tenant adapter |

## Chosen design
```mermaid
flowchart LR
  login[Login + MFA] --> sess[Session + refresh]
  sess --> pol[can() policy]
  pol --> api[API guard]
  api --> rls[(RLS enforced)]
```
A1: Argon2id, access ≤15min, rotating refresh, revoke on
logout/role-remove/member-remove; TOTP staff admins; phone
OTP customers later; API keys scoped + hashed; break-glass
read-only + banner + audit. A2: permissions in code, roles
as data; one policy module; per-object checks every id
read/write; matrix is test oracle. A3: pooled cells; tenant
from session, never body; tenant_id + composite keys; RLS
enabled+forced; app role least-priv; set_config per txn;
jobs/cache/search/storage carry tenant.

## Rejected alternatives
Hosted-only now: MAU + residency unresolved. No RLS (app
only): silent bypass risk, rejected by /secure F3.

## Rules specs must cite
R1 tenant never from client input. R2 every id read/write
has object check. R3 new tenant table → RLS + test.
R4 support impersonation read-only + audited.

## Values this area owns
| Value | Source | Freshness | Failure behaviour |
|---|---|---|---|
| Session identity | session + membership join | per request | 401, no data |
| Permission verdict | policy manifest perm_v | per request | deny closed |
| Tenant scope | membership tenant_id | per request | zero rows |

## Open questions
None allowed at approval. SSO tenant: proposed adapter.
