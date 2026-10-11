-- 004: restricted app role (least privilege, never owner/BYPASSRLS)
-- The API connects as majibill_app so RLS always applies.
-- Table owners bypass RLS; this role does not.
BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'majibill_app') THEN
    CREATE ROLE majibill_app LOGIN PASSWORD 'majibill_app_dev';
  ELSE
    ALTER ROLE majibill_app LOGIN PASSWORD 'majibill_app_dev';
  END IF;
END $$;

GRANT CONNECT ON DATABASE majibill TO majibill_app;
GRANT USAGE ON SCHEMA public TO majibill_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO majibill_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO majibill_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO majibill_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO majibill_app;

-- audit stays append-only for the app role too
REVOKE UPDATE, DELETE ON audit_events FROM majibill_app;

COMMIT;
