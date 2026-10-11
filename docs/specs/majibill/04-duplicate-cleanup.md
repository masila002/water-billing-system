# Spec majibill/04 — duplicate-folder cleanup + clear root layers

Status: Proposed
Depth: beta
Scope: docs/scope/01-layers.md#F01-F11 (uniformity follow-up; no new product behaviour)
SDRs: SDR-001/R2, SDR-007/R1-R3, SDR-008/R1, SDR-009/R1-R3
Branch: feature/production/05-duplicate-cleanup
Lockstep: none

## 1. Outcome and acceptance criteria
- CLEAN-AC1 `backend/`, `web/`, `mobile/` remain single-pointer READMEs only; zero `.ts`/`.js`/`.json` under them (`git ls-files backend web mobile | grep -v README` empty).
- CLEAN-AC2 `packages/domain/src/` holds `.ts` only; tracked `money.js`, `policy.js`, `sessions.js` removed; `npm test` still 14/14 green via one import rule.
- CLEAN-AC3 `dist/`, `apps/web/.next/`, `*.tsbuildinfo` never appear in `git status`; root `.gitignore` covers `.next/` (plus existing `dist/`).
- CLEAN-AC4 `apps/web/next-env.d.ts` committed once and stable across rebuilds (build does not dirty the tree).
- CLEAN-AC5 one layer map in `AGENTS.md` + `docs/trackers/root.md` names every root dir once with owner + gate; zero "duplicate?" questions remain.

## 2. Contract and consumers
Repo-layout contract (no HTTP change). Canonical owners:
`apps/api` (sole DB writer), `apps/web` (staff client), `apps/reader` (field client), `packages/domain` (pure TS source), `packages/contracts` (OpenAPI source), `packages/ui`, `packages/config`, `db/` (prod SQL), `demo-app/` (isolated pitch incl. its own `database/`), `infra/` (runnable topology), `devops/` (cells path), `qa/` (proof suites), `mcp/`, `ai/`, `scripts/` (gates), `docs/` + `project-kit/` (public truth). Pointers `backend/`, `web/`, `mobile/` keep one README each for external-shaped tooling. Consumers: engineers, CI (`verify.yml`), gate scripts.

## 3. Data changes
None. File deletions only (`packages/domain/src/*.js`), ignore-rule addition, pointer READMEs clarified. No migration. Reversible: `git revert`.

## 4. Authorization matrix
No auth change; matrix-T1..T6 unchanged (spec 02). File moves touch no tenant data.

| Role | Action | Allowed | Tenant scope | Test id |
|---|---|---|---|---|
| tenant_admin | * (pilot) | yes | own tenant | matrix-T1 |
| anon | any write | no | — | matrix-T6 |

### 4.1 Security, audit, observability and scale
| Item | This feature |
|---|---|
| Permissions added or used | none added; matrix-T1..T6 reused |
| Object checks | n/a (no id reads/writes) |
| Tenant data | none touched; `db/` vs `demo-app/database/` boundary reaffirmed, no shared data |
| Audit events | layer-cleanup commit audited via PR; no money writes |
| Log and trace events | no new logs; pre-push `git status --porcelain` must be empty (ids only, no PII) |
| Scale | zero runtime impact; build cache smaller |
| Proof tests | `npm test` 14/14, `npm run demo:test` 13/13, `npm run gates` exit 0, `git status` clean |

## 5. Value-source table
| Value | Source | Owner | Freshness | Failure behaviour |
|---|---|---|---|---|
| Canonical layer map | this spec §2 + AGENTS.md table | root | per PR | block merge on drift |
| Domain truth | `packages/domain/src/*.ts` | domain | per commit | `tsc` fails |
| Test verdict | `npm test` exit code | domain | per push | block merge |
| Gate verdict | `npm run gates` exit code | infra | per push | block merge |
| Pointer dirs | `backend|web|mobile/README.md` | root | stable | delete code if found |

## 6. Pagination, limits, access rate
n/a (no list endpoints touched).

## 7. Failure modes and edge cases

## 8. UI states (if any)
None. Shell pages unchanged.

## 9. External APIs
| Library / provider | Pinned version | Doc reference | Status | Date |
|---|---|---|---|---|
| TypeScript | 5.9.3 (root resolved) | https://www.typescriptlang.org/docs | VERIFIED | 2026-10-11 |
| Next.js | 16.4.0 | https://nextjs.org/docs | VERIFIED | 2026-10-11 |

## 10. Reuse list
Searched: `git ls-files` (tracked set: domain `.ts`+`.js` pairs; pointers hold README-only; `qa/`/`devops/` real docs; `inspo/`+`docs/inspo/` both READMEs; `project-kit/` vs `.baseline/project-kit/` diverged); `search_codebase` (no imports from `../backend|../web|../mobile`; `scripts/check-inspo-isolation.py` enforces inspo quarantine); `diff -r project-kit .baseline/project-kit` (public kit = product truth, private = workflow state — keep both, see D-036). Reused: gate scripts, RLS catalog check, pointer README pattern. Not reused: nothing deleted beyond §3.

## 11. Uniformity
Every `AGENTS.md` area file + `docs/trackers/*.md` gate rows must name the §2 canonical path (not a pointer). `apps/api/AGENTS.md:18` ("`backend/` here is a pointer only") stays as the pattern; mirror one line in web/reader if missing. `docs/trackers/root.md` layer table extended with pointer + docs rows. Both inspo READMEs keep cross-links; gate script unchanged.

## 12. Test and verify plan
| AC id | Verify step | Automated test | Authz-negative test |
|---|---|---|---|
| CLEAN-AC1 | `git ls-files backend web mobile | grep -v README` empty | CI step (new) | n/a |
| CLEAN-AC2 | `git ls-files packages/domain/src | grep '\.js$'` empty + `npm test` 14/14 | `npm test` | n/a |
| CLEAN-AC3 | `git check-ignore apps/web/.next` + `git status --porcelain` clean post-build | `git diff --check` | n/a |
| CLEAN-AC4 | rebuild web, `git diff --name-only` shows no `next-env.d.ts` | web build | n/a |
| CLEAN-AC5 | layer table lists every root dir once | docs review | n/a |

## 13. Decisions
| ID | Options | Chosen | Rejected + reason | Register row |
|---|---|---|---|---|
| D-033 | pointers: keep READMEs vs delete dirs vs symlinks | keep README pointers, zero code | delete: breaks external-shaped tooling that expects `backend/ web/ mobile/`; symlinks: Windows/zip fragility | D-033 |
| D-034 | domain `.js` removal import fix: point tests at `dist/` vs ts-loader vs inline build | point tests at `dist/` output (build-then-test) | ts-loader: new runtime dep for 14 unit tests; keep committed `.js`: defeats cleanup, drift risk proven by `sessions.js` exporting `ACCESS_MINUTES` while `.ts` exports `ACCESS_MINUTES_EXPORT` | D-034 |
| D-035 | `.next/` ignore: root `.gitignore` entry vs `apps/web/.gitignore` vs leave untracked | root `.gitignore` `.next/` entry (covers all Next apps incl. future) | leave: repeats today's noise every session; per-app file: scatters one global rule | D-035 |
| D-036 | docs split: merge `project-kit/`+`.baseline/project-kit` vs keep | keep split (public product truth vs private workflow state) | merge: leaks private workflow into git or pollutes product kit with rescue history | D-036 |
| D-037 | `db/` vs `demo-app/database/`: merge vs keep | keep both (prod migrations vs isolated pitch seed; spec 01 §10 reuse list already superseded demo schema) | merge: couples pilot RLS ledger to fictional demo seed | D-037 |
| D-038 | `devops/` vs `infra/`: merge vs keep | keep both (runnable topology vs cells path per `devops/AGENTS.md`) | merge: mixes today's compose with Terraform future | D-038 |
| D-039 | `qa/` stays root-level vs move under `apps/api/test/` | stays root (cross-layer proof suites per `qa/PLAN.md`) | move: hides two-tenant/ledger/audit scope inside one app | D-039 |

Register rows D-033..D-039 appended as proposed; merge approves.

## 14. Rollback
`git revert` the cleanup commit. Deleted `.js` files restore from history; ignore-rule removal re-exposes (not deletes) cache dirs. No data touched; demo + prod suites re-run to confirm.

## 15. Open assumptions
ASSUMPTION(A-04): operator accepts `dist/`-first domain tests (build-then-test) over committed `.js` — confirm at review; fallback is a TS loader, not re-committing output.

Wrong-dir delete (e.g. removing `db/` thinking it dupes demo schema) → guard: explicit keep-list in §2 + `git ls-files` check per CLEAN-AC1 before any `git rm`. Test import break (tests import `../src/*.js`) → switch imports to built output or TS loader in one commit with green `npm test` (see §13 D-034 options). `next-env.d.ts` churn → restore after build + ignore `.next/`. Cache-regen noise → pre-push clear rule (operator order) runs before `git status` check.
