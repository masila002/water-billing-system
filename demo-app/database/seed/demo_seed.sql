BEGIN;

SELECT set_config('app.tenant_id', '11111111-1111-4111-8111-111111111111', true);

INSERT INTO tenants (id, name, slug)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'MajiBill Demo Utility',
    'majibill-demo'
);

INSERT INTO users (id, tenant_id, email, full_name, role)
VALUES
    (
        '22222222-2222-4222-8222-222222222221',
        '11111111-1111-4111-8111-111111111111',
        'admin@example.test',
        'Demo Administrator',
        'admin'
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'reader@example.test',
        'Demo Meter Reader',
        'meter_reader'
    ),
    (
        '22222222-2222-4222-8222-222222222223',
        '11111111-1111-4111-8111-111111111111',
        'cashier@example.test',
        'Demo Cashier',
        'cashier'
    );

INSERT INTO customers (id, tenant_id, customer_number, full_name, email, address)
VALUES
    (
        '33333333-3333-4333-8333-333333333331',
        '11111111-1111-4111-8111-111111111111',
        'CUS-0001',
        'Amina Demo',
        'amina@example.test',
        'Nakuru'
    ),
    (
        '33333333-3333-4333-8333-333333333332',
        '11111111-1111-4111-8111-111111111111',
        'CUS-0002',
        'Brian Sample',
        'brian@example.test',
        'Nakuru'
    );

INSERT INTO tariffs (
    id, tenant_id, name, fixed_charge_minor, rate_per_unit_minor, effective_from
)
VALUES (
    '44444444-4444-4444-8444-444444444441',
    '11111111-1111-4111-8111-111111111111',
    'Domestic Demo',
    50000,
    25000,
    DATE '2026-01-01'
);

INSERT INTO service_accounts (
    id, tenant_id, customer_id, tariff_id, account_number, meter_number
)
VALUES
    (
        '55555555-5555-4555-8555-555555555551',
        '11111111-1111-4111-8111-111111111111',
        '33333333-3333-4333-8333-333333333331',
        '44444444-4444-4444-8444-444444444441',
        'ACC-0001',
        'MTR-0001'
    ),
    (
        '55555555-5555-4555-8555-555555555552',
        '11111111-1111-4111-8111-111111111111',
        '33333333-3333-4333-8333-333333333332',
        '44444444-4444-4444-8444-444444444441',
        'ACC-0002',
        'MTR-0002'
    );

INSERT INTO meter_readings (
    id, tenant_id, service_account_id, previous_reading, current_reading,
    read_at, submitted_by, idempotency_key
)
VALUES (
    '66666666-6666-4666-8666-666666666661',
    '11111111-1111-4111-8111-111111111111',
    '55555555-5555-4555-8555-555555555551',
    120.000,
    135.500,
    TIMESTAMPTZ '2026-09-30 10:00:00+03',
    '22222222-2222-4222-8222-222222222222',
    'demo-reading-acc-0001-2026-09'
);

INSERT INTO bills (
    id, tenant_id, service_account_id, bill_number, period_start, period_end,
    issued_at, due_at, status, subtotal_minor, total_minor
)
VALUES
    (
        '77777777-7777-4777-8777-777777777771',
        '11111111-1111-4111-8111-111111111111',
        '55555555-5555-4555-8555-555555555551',
        'INV-2026-0001',
        DATE '2026-09-01',
        DATE '2026-09-30',
        TIMESTAMPTZ '2026-10-01 08:00:00+03',
        DATE '2026-10-15',
        'partially_paid',
        437500,
        437500
    ),
    (
        '77777777-7777-4777-8777-777777777772',
        '11111111-1111-4111-8111-111111111111',
        '55555555-5555-4555-8555-555555555552',
        'INV-2026-0002',
        DATE '2026-09-01',
        DATE '2026-09-30',
        TIMESTAMPTZ '2026-10-01 08:00:00+03',
        DATE '2026-10-15',
        'issued',
        300000,
        300000
    );

INSERT INTO bill_items (
    tenant_id, bill_id, description, quantity, unit_price_minor, amount_minor
)
VALUES
    (
        '11111111-1111-4111-8111-111111111111',
        '77777777-7777-4777-8777-777777777771',
        'Water consumption (15.5 m3)',
        15.500,
        25000,
        387500
    ),
    (
        '11111111-1111-4111-8111-111111111111',
        '77777777-7777-4777-8777-777777777771',
        'Monthly service charge',
        1,
        50000,
        50000
    ),
    (
        '11111111-1111-4111-8111-111111111111',
        '77777777-7777-4777-8777-777777777772',
        'Water and service charges',
        10,
        30000,
        300000
    );

INSERT INTO payments (
    id, tenant_id, service_account_id, receipt_number, amount_minor, method,
    external_reference, idempotency_key, recorded_by, paid_at
)
VALUES (
    '88888888-8888-4888-8888-888888888881',
    '11111111-1111-4111-8111-111111111111',
    '55555555-5555-4555-8555-555555555551',
    'RCT-2026-0001',
    200000,
    'mpesa',
    'DEMO-MPESA-0001',
    'demo-payment-acc-0001-2026-10-01',
    '22222222-2222-4222-8222-222222222223',
    TIMESTAMPTZ '2026-10-02 09:30:00+03'
);

INSERT INTO payment_allocations (
    tenant_id, service_account_id, payment_id, bill_id, amount_minor
)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    '55555555-5555-4555-8555-555555555551',
    '88888888-8888-4888-8888-888888888881',
    '77777777-7777-4777-8777-777777777771',
    200000
);

INSERT INTO audit_events (
    tenant_id, actor_user_id, event_type, entity_type, entity_id, details
)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222223',
    'payment.recorded',
    'payment',
    '88888888-8888-4888-8888-888888888881',
    '{"source": "demo_seed"}'::jsonb
);

COMMIT;
