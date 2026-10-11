-- 001: production foundation — tenants, identity, customers, accounts, tariffs
-- Plain SQL, forward-only. Requires pgcrypto + pg_trgm.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  currency_code char(3) NOT NULL DEFAULT 'KES',
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('provisioning','active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_citext text NOT NULL UNIQUE,
  full_name text NOT NULL,
  password_hash text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('tenant_admin','billing_manager','cashier','meter_reader','auditor')),
  scope_zone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  customer_number text NOT NULL,
  full_name text NOT NULL,
  phone_e164 text,
  email text,
  address text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, customer_number),
  UNIQUE (tenant_id, id)
);

CREATE TABLE tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  fixed_charge_minor bigint NOT NULL DEFAULT 0 CHECK (fixed_charge_minor >= 0),
  rate_per_unit_minor bigint NOT NULL CHECK (rate_per_unit_minor >= 0),
  effective_from date NOT NULL,
  effective_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE (tenant_id, name, effective_from),
  UNIQUE (tenant_id, id)
);

CREATE TABLE service_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  customer_id uuid NOT NULL,
  tariff_id uuid NOT NULL,
  account_number text NOT NULL,
  meter_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','disconnected','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, account_number),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id),
  FOREIGN KEY (tenant_id, tariff_id) REFERENCES tariffs(tenant_id, id)
);

CREATE INDEX customers_tenant_idx ON customers (tenant_id);
CREATE INDEX customers_name_trgm_idx ON customers USING gin (full_name gin_trgm_ops);

-- RLS: enabled + forced on every tenant table in this migration
-- memberships carries tenant_id and is covered from the start.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','memberships','customers','tariffs','service_accounts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

COMMIT;
