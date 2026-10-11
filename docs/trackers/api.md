# API tracker (core-api + domain + db)

## 0. Next
- [ ] Identity slice: sessions, Argon2id, TOTP, RBAC wiring, RLS policies, manifest
- [x] Foundation: health, domain math/policy, migrations 001/002a/002b

## 1. Evidence
- build:production green 2026-10-11; test:production 9/9
- migrate on majibill-postgres :5434: 16 tables, RLS on tenant tables
