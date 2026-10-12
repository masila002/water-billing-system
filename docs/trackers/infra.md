# Infra tracker

## 0. Next
- [x] Root compose `majibill` project: pg :5434 + redis :6381 healthy
- [x] API Dockerfile + app profile + healthcheck
- [ ] Staging/prod cell definitions (Terraform path per SDR-009)

## 1. Evidence
- `docker compose ps`: both healthy 2026-10-11
- `docker compose config -q`: run before push
