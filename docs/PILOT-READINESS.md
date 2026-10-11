# From demo to a utility pilot

The demo proves a local customer-to-receipt workflow. A production pilot needs a separate implementation and acceptance process.

| Workstream | Required proof before real use |
|---|---|
| Discovery | Signed-off utility tariff, rounding, tax treatment, periods, opening balances, reversals and roles |
| Identity | Verified login, sessions, tenant membership and server authorization; negative tenant/role tests |
| Data | PostgreSQL end-to-end workflow, concurrent payments, migration rehearsal and restore exercise |
| Accounting | Balanced journal design, immutable postings, credits, reversal/adjustment approval and reconciliation |
| M-Pesa | Utility-owned credentials, callback authentication, replay tests, settlement reconciliation and live acceptance |
| Operations | Deployment review, backups, monitoring, incident ownership and support runbooks |
| Privacy | Real-data handling/retention and applicable obligations reviewed by the responsible specialists |
| Product | Approved statements, customer communications, staff training and measured usability |

Do not treat research pricing, county-scale capacity, commercial timelines or partnership terms as committed facts. No real payment credentials, authenticated production deployment or regulatory certification are part of this demo.

Dependency audit on 2026-10-11 found 7 advisories in the inherited backend dependency tree (2 high, 4 moderate, 1 low). Upgrade and reverify the NestJS integration before exposure; the standalone browser demo does not run that API. The API now defaults to loopback binding.
