# Risk register — MAJIBILL

| Risk | Impact | Mitigation | Owner |
|---|---|---|---|
| Cross-tenant leak | catastrophic | RLS forced + two-tenant suite + catalog test | backend |
| Unbalanced ledger | catastrophic | balanced-journal check + golden bill tests | backend |
| Daraja replay / forgery | high | inbox unique key + signature verify + suspense | payments |
| Demo shortcut in money path | high | separate runtimes/ports/DBs; no shared imports | all |
| Offline sync conflict | high | client UUIDs + server validation + supervisor queue | mobile |
| Bill-run overlap | high | advisory lock per (tenant, cycle) + chunking | backend |
| SMS cost blowout | medium | per-segment costing + quotas + soft limits | platform |
| Secret in repo | high | secrets check; env NAMES only in docs | all |
