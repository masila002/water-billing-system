BEGIN;

CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    currency_code char(3) NOT NULL DEFAULT 'KES',
    timezone text NOT NULL DEFAULT 'Africa/Nairobi',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    email text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'cashier', 'accountant', 'meter_reader')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email),
    UNIQUE (tenant_id, id)
);

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    customer_number text NOT NULL,
    full_name text NOT NULL,
    phone text,
    email text,
    address text,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, customer_number),
    UNIQUE (tenant_id, id)
);

CREATE TABLE tariffs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
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
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    customer_id uuid NOT NULL,
    tariff_id uuid NOT NULL,
    account_number text NOT NULL,
    meter_number text NOT NULL,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, account_number),
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, customer_id)
        REFERENCES customers (tenant_id, id),
    FOREIGN KEY (tenant_id, tariff_id)
        REFERENCES tariffs (tenant_id, id)
);

CREATE TABLE meter_readings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    service_account_id uuid NOT NULL,
    previous_reading numeric(12, 3) NOT NULL CHECK (previous_reading >= 0),
    current_reading numeric(12, 3) NOT NULL CHECK (current_reading >= previous_reading),
    read_at timestamptz NOT NULL,
    submitted_by uuid,
    idempotency_key text NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, idempotency_key),
    UNIQUE (tenant_id, service_account_id, id),
    FOREIGN KEY (tenant_id, service_account_id)
        REFERENCES service_accounts (tenant_id, id),
    FOREIGN KEY (tenant_id, submitted_by)
        REFERENCES users (tenant_id, id)
);

CREATE TABLE bills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    service_account_id uuid NOT NULL,
    meter_reading_id uuid,
    bill_number text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    due_at date NOT NULL,
    status text NOT NULL DEFAULT 'issued'
        CHECK (status IN ('issued', 'partially_paid', 'paid', 'overdue', 'void')),
    subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
    total_minor bigint NOT NULL CHECK (total_minor >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (period_end >= period_start),
    UNIQUE (tenant_id, bill_number),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, service_account_id, id),
    UNIQUE (tenant_id, service_account_id, period_start, period_end),
    FOREIGN KEY (tenant_id, service_account_id)
        REFERENCES service_accounts (tenant_id, id),
    FOREIGN KEY (tenant_id, service_account_id, meter_reading_id)
        REFERENCES meter_readings (tenant_id, service_account_id, id)
);

CREATE TABLE bill_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    bill_id uuid NOT NULL,
    description text NOT NULL,
    quantity numeric(12, 3) NOT NULL CHECK (quantity >= 0),
    unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
    amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (tenant_id, bill_id)
        REFERENCES bills (tenant_id, id)
);

CREATE UNIQUE INDEX bills_meter_reading_unique
    ON bills (tenant_id, meter_reading_id)
    WHERE meter_reading_id IS NOT NULL;

CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    service_account_id uuid NOT NULL,
    receipt_number text NOT NULL,
    amount_minor bigint NOT NULL CHECK (amount_minor > 0),
    method text NOT NULL CHECK (method IN ('mpesa', 'cash', 'bank', 'other')),
    status text NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('pending', 'confirmed', 'failed', 'reversed')),
    external_reference text,
    idempotency_key text NOT NULL,
    recorded_by uuid,
    paid_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, receipt_number),
    UNIQUE (tenant_id, idempotency_key),
    UNIQUE (tenant_id, service_account_id, id),
    FOREIGN KEY (tenant_id, service_account_id)
        REFERENCES service_accounts (tenant_id, id),
    FOREIGN KEY (tenant_id, recorded_by)
        REFERENCES users (tenant_id, id)
);

CREATE UNIQUE INDEX payments_external_reference_unique
    ON payments (tenant_id, method, external_reference)
    WHERE external_reference IS NOT NULL;

CREATE TABLE payment_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    service_account_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    bill_id uuid NOT NULL,
    amount_minor bigint NOT NULL CHECK (amount_minor > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (tenant_id, service_account_id, payment_id)
        REFERENCES payments (tenant_id, service_account_id, id),
    FOREIGN KEY (tenant_id, service_account_id, bill_id)
        REFERENCES bills (tenant_id, service_account_id, id)
);

CREATE TABLE audit_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants (id),
    actor_user_id uuid,
    event_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users (tenant_id, id)
);

CREATE FUNCTION reject_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_events are append-only';
END;
$$;

CREATE TRIGGER audit_events_append_only
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION reject_audit_event_mutation();

CREATE INDEX customers_tenant_name_idx
    ON customers (tenant_id, full_name);
CREATE INDEX service_accounts_tenant_customer_idx
    ON service_accounts (tenant_id, customer_id);
CREATE INDEX meter_readings_account_read_at_idx
    ON meter_readings (tenant_id, service_account_id, read_at DESC);
CREATE INDEX bills_account_due_at_idx
    ON bills (tenant_id, service_account_id, due_at);
CREATE INDEX payments_account_paid_at_idx
    ON payments (tenant_id, service_account_id, paid_at DESC);
CREATE INDEX audit_events_tenant_created_at_idx
    ON audit_events (tenant_id, created_at DESC);

CREATE POLICY tenant_isolation ON tenants
    USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users',
        'customers',
        'tariffs',
        'service_accounts',
        'meter_readings',
        'bills',
        'bill_items',
        'payments',
        'payment_allocations',
        'audit_events'
    ]
    LOOP
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
            table_name
        );
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    END LOOP;
END;
$$;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

COMMIT;
