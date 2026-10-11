# MajiBill root tracker

## 0. Next
Branch `feature/production/05-duplicate-cleanup` carries spec 04
(docs/specs/majibill/04-duplicate-cleanup.md, Proposed) + D-033..D-039
(proposed; merge approves). No code yet — approve spec, then /develop
implements CLEAN-AC1..AC5. Open: ASSUMPTION(A-04) dist-first domain tests.
Demo stays isolated.

## 1. Status
| Slice | State | Evidence |
|---|---|---|
| 01 foundation | merged PR #10 | build:production, 9/9 domain, migrate 16 tables, health ok |
| 02 identity | in progress (this branch) | infra + docs; code slice next |
