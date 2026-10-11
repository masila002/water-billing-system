# Cells path — pooled default, silo/sovereign same image (SDR-009)

Pilot: root `docker-compose.yml` + managed Postgres when available.
Next: `devops/terraform/` cell module (network, db, cache, api,
workers, observability) with per-tenant cost tags. Sovereign bundle:
signed images + compose/Helm + migrate job + runbooks + licence file.
Triggers in scope 01 (deferred table).
