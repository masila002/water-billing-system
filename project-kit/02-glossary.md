# Glossary — MAJIBILL

| Term | Meaning |
|---|---|
| Tenant | An isolated utility on the platform (WSP, estate, institution) |
| Cell | A complete deployable copy of the data-plane stack |
| RLS | Postgres row-level security: the DB filters rows per tenant |
| Ledger | Immutable debits/credits; balances derive, never stored |
| Suspense | Holding account for unmatched payments |
| Maker-checker | Two-person control: one requests, another approves |
| Bill run | Chunked batch issuing a cycle's bills with advisory locks |
| Inbox | Provider-truth table for Daraja callbacks before posting |
| Outbox | Transactional event table relayed to queues |
| Manifest | Permission + scope payload driving web + mobile UI |
| WASREB | Water Services Regulatory Board |
| Daraja | Safaricom M-Pesa API platform (C2B, STK Push) |
