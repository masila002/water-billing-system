# Spec majibill/03 — root takeover (MajiBill owns root)

Status: Approved
Depth: beta
Scope: docs/scope/03-root-takeover.md#F16-F20
SDRs: SDR-001/R2, SDR-007/R1-R3, SDR-009/R1-R3
Branch: feature/production/04-identity
Lockstep: none

## 1. Outcome and acceptance criteria
Scope 03 F16-AC1..F20-AC2 (12 checks). Bare root commands serve
MajiBill; demo lives behind explicit `demo:*` scripts and its own
folder docs.

## 2. Contract and consumers
Root command map (new contract):
dev → staff-web :3001 · build → core-api + domain + staff-web ·
test → production domain (14) · demo → demo-frontend :3000 ·
api → core-api :4000 · demo:api → demo-backend :4000 (explicit port).
Consumers: engineers (daily loop), CI (both maps), guides.

## 3. Data changes
None. Command routing only.

## 4. Authorization matrix
No auth change; matrix-T1..T6 unchanged (spec 02).

### 4.1 Security, audit, observability and scale
| Item | This feature |
|---|---|
| Permissions | none added |
| Object checks | none (no data change) |
| Tenant data | none |
| Audit events | none (no domain write) |
| Log and trace events | dev-server logs local only |
| Scale | staff-web dev 1 user; build once per push |
| Proof tests | gate scripts; build exits |

## 5. Value-source table
| Value | Source | Owner | Freshness | Failure behaviour |
|---|---|---|---|---|
| Root dev entry | apps/web dev script | web | per run | error with port |
| Root build verdict | core-api + domain + web builds | root | per push | block merge |
| Demo entry | demo-app packages | demo | per run | demo guide |

## 6. Pagination, limits, access rate
Dev servers loopback-only. No rate change.
## 7. Failure modes and edge cases
Port clash :3001 taken → error names the holder, suggest PORT env.
Next missing layout → build fails loudly (fixed here). Stale demo
expectation (`npm run dev` shows demo) → guide + `demo` script +
console banner. CI drift → both maps verified per PR.

## 8. UI states
Staff shell: loading, empty (first-run: no tenant yet — points at
dev manual), error, success. Demo unchanged.

## 9. External APIs
| Library / provider | Pinned version | Doc reference | Status | Date |
|---|---|---|---|---|
| Next.js | 16.4.0 | https://nextjs.org/docs | VERIFIED | 2026-10-11 |

## 10. Reuse list
Searched: demo-app frontend dev/build scripts — reused as template
for `demo:*` namespaced scripts, not for root. web shell page —
reused, layout added. compose service names — reused verbatim.

## 11. Uniformity
All `dev:*` scripts loopback-first. All `build` scripts exit
non-zero on warning-as-error where supported. Demo ports frozen
(:3000 dev, :3100 e2e, :4000 demo API explicit).

## 12. Test and verify plan
| AC id | Verify step | Automated test | Authz-negative test |
|---|---|---|---|
| F16-AC1..AC5 | run each root script, confirm target | build exits + curl | n/a |
| F17-AC1/AC2 | web dev + build | next build | n/a |
| F18-AC1 | dev:infra up, names resolve | compose ps | n/a |
| F19-AC1/AC2 | demo scripts from root + folder | demo build/test | n/a |
| F20-AC1/AC2 | guides grep + CI run | gates | n/a |

## 13. Decisions
| ID | Options | Chosen | Rejected + reason | Register row |
|---|---|---|---|---|
| R-01 | root dev = web vs api vs demo | staff-web :3001 (visible product) | demo: hides real app; api: no UI to see | D-029 |
| R-02 | demo scripts prefix | `demo:*` (demo, demo:build, demo:test, demo:e2e, demo:api) | keep bare names: collision forever | D-030 |
| R-03 | web port | 3001 (demo keeps 3000) | share 3000: clash + confusion | D-031 |
| R-04 | infra script form | real compose service names | old aliases: no such service | D-032 |

## 14. Rollback
Revert commit; old map in git history. No data touched.

## 15. Open assumptions
None. Ports frozen by this spec.
