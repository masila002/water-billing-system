-- 002a: readings, cycles, bills
BEGIN;

CREATE TABLE meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  service_account_id uuid NOT NULL,
  previous_reading numeric(12,3) NOT NULL CHECK (previous_reading >= 0),
  current_reading numeric(12,3) NOT NULL CHECK (current_reading >= previous_reading),
  read_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'mobile' CHECK (source IN ('mobile','web','import','estimate')),
  flag text NOT NULL DEFAULT 'none',
  submitted_by uuid,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, service_account_id, id),
  FOREIGN KEY (tenant_id, service_account_id) REFERENCES service_accounts(tenant_id, id)
);

CREATE TABLE billing_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (tenant_id, id)
);

CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  service_account_id uuid NOT NULL,
  meter_reading_id uuid,
  bill_number text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_at date NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bill_number),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, service_account_id) REFERENCES service_accounts(tenant_id, id)
);

CREATE TABLE bill_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bill_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL,
  unit_price_minor bigint NOT NULL,
  amount_minor bigint NOT NULL,
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id)
);

COMMIT;
