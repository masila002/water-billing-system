# AGENTS.md — MajiBill devops (`devops/` + `infra/`)

`infra/` holds runnable topology (compose, Dockerfiles, env examples).
`devops/` holds the path to staging/prod (Terraform/OpenTofu cells,
registry, release runbooks). One artifact, three cells. Gate:
`docker compose config -q`. Tracker: `docs/trackers/infra.md`.
