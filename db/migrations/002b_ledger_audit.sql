-- 002b: inbox, payments, ledger, audit, outbox
BEGIN;

CREATE TABLE payment_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  provider text NOT NULL,
  provider_txn_id text NOT NULL,
  raw_payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, provider_txn_id)
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  service_account_id uuid NOT NULL,
  receipt_number text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  method text NOT NULL,
  provider_txn_id text,
  idempotency_key text NOT NULL,
  recorded_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, receipt_number),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, service_account_id, id),
  FOREIGN KEY (tenant_id, service_account_id) REFERENCES service_accounts(tenant_id, id)
);

CREATE TABLE ledger_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  kind text NOT NULL,
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);

CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  journal_id uuid NOT NULL,
  account_code text NOT NULL,
  service_account_id uuid,
  debit_minor bigint NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor bigint NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit_minor > 0 OR credit_minor > 0),
  FOREIGN KEY (tenant_id, journal_id) REFERENCES ledger_journals(tenant_id, id)
);

CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  outcome text NOT NULL DEFAULT 'ok',
  reason text,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text,
  trace_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_events are append-only'; END; $$;

CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();

CREATE TABLE outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  topic text NOT NULL,
  payload jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['meter_readings','billing_cycles','bills','bill_lines','payment_inbox','payments','ledger_journals','ledger_entries','audit_events','outbox'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

COMMIT;
