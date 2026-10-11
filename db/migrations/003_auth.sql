-- 003: sessions, MFA secrets, login attempts + RLS policies
BEGIN;

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  refresh_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_exp_idx ON sessions (user_id, expires_at);
CREATE INDEX sessions_tenant_idx ON sessions (tenant_id);

CREATE TABLE totp_secrets (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  secret_enc text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  ip text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL DEFAULT false
);
CREATE INDEX login_attempts_email_ip_at_idx ON login_attempts (email, ip, at DESC);

-- RLS policies: tenant isolation on every tenant table.
-- App role sets app.tenant_id per transaction; policies below enforce it.
-- tenants is special: its key IS the tenant (id), not tenant_id.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['memberships','customers','tariffs','service_accounts','meter_readings','billing_cycles','bills','bill_lines','payment_inbox','payments','ledger_journals','ledger_entries','audit_events','outbox'] LOOP
    BEGIN
      EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)', t);
    EXCEPTION WHEN duplicate_object THEN
      -- policy already exists; keep idempotent for re-runs
      NULL;
    END;
  END LOOP;
  BEGIN
    EXECUTE 'CREATE POLICY tenant_isolation ON tenants USING (id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

COMMIT;
