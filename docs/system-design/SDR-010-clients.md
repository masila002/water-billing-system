# SDR-010 — clients and parity (web + reader)

Status: proposed
Owner: operator
Depends on: SDR-001
KB refs: Mobile §13-14; Frontend; MB-08 product; MB-11 parity

## Decision summary
Staff web is reference; reader mobile offline-first;
manifest-driven parity; every screen has 4 states.

## Options considered
| Option | Fit | Cost | Risk | KB position |
|---|---|---|---|---|
| Manifest parity | one model all clients | registry | low | default |
| Hand-built per role | custom | drift | med | rejected |
| Web-only field | no install | no offline | high | rejected |

## Chosen design
Web: Next.js route groups (staff, admin), DataTable,
FilterBar, MoneyInput, StatusBadge, Timeline, EmptyState.
Mobile: Expo Router (routes, capture, queue, sync),
SQLite outbox, photo证据 compression, conflict review.
Manifest /v1/me/manifest cached + perm_v bump. Offline:
reads cached, writes queued with UUIDs, sensitive actions
need online re-check. Loading/empty/error/denied states
specified before build; no colour-only status.

## Rejected alternatives
Per-role hand builds: drift. Online-only reader: fails
route-day reality.

## Rules specs must cite
R1 UI hides, API enforces; matrix test per cell.
R2 every screen defines 4 states + offline rule.
R3 conflicts surface to supervisor, never silent merge.

## Values this area owns
| Value | Source | Freshness | Failure behaviour |
|---|---|---|---|
| Visible actions | manifest perm_v | session | hide + 403 |
| Sync state | outbox counters | realtime | queued badge |

## Open questions
None allowed at approval.
