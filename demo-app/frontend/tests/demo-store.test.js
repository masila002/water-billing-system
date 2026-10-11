import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoStore,
  DEMO_STORAGE_KEY,
  DEMO_TENANT_ID,
} from "../src/lib/demo-store.js";
const admin = { role: "admin", tenantId: DEMO_TENANT_ID };
function fixture() {
  const values = new Map();
  let count = 0;
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const config = {
    storage,
    now: () => "2026-10-11T12:00:00Z",
    id: () => `generated-${++count}`,
  };
  const store = createDemoStore(config);
  const get = (path, context = admin) => store.request(path, {}, context);
  const post = (path, body, context = admin) =>
    store.request(
      path,
      { method: "POST", body: JSON.stringify(body) },
      context,
    );
  return { storage, config, store, get, post };
}
function journey(f) {
  const customer = f.post("/customers", {
    customerNumber: "CUS-NEW",
    fullName: "Demo Household",
  });
  const account = f.post("/accounts", {
    customerId: customer.id,
    accountNumber: "ACC-NEW",
    meterNumber: "MTR-NEW",
    tariffId: "tariff-domestic",
    initialReading: 50,
  });
  const readingInput = {
    serviceAccountId: account.id,
    previousReading: 50,
    currentReading: 68,
    readAt: "2026-10-10",
    idempotencyKey: "reading-new",
  };
  const reading = f.post("/readings", readingInput);
  const billInput = {
    serviceAccountId: account.id,
    meterReadingId: reading.id,
    periodStart: "2026-10-01",
    periodEnd: "2026-10-10",
    dueAt: "2026-10-25",
  };
  const bill = f.post("/bills/generate", billInput);
  return { customer, account, reading, bill, readingInput, billInput };
}
const payment = (account, bill, overrides = {}) => ({
  serviceAccountId: account.id,
  billId: bill.id,
  amountMinor: 50000,
  method: "mpesa",
  externalReference: "DEMO-NEW",
  idempotencyKey: "payment-new",
  ...overrides,
});

test("AC2–4 full customer, meter, reading, bill and partial/full payment journey persists balanced totals", () => {
  const f = fixture();
  const initial = f.get("/dashboard");
  const { account, bill } = journey(f);
  assert.equal(bill.totalMinor, 150000); // 18 units × KES 75 + KES 150.
  f.post("/payments", payment(account, bill));
  assert.equal(
    f.get("/bills").find((b) => b.id === bill.id).status,
    "partially_paid",
  );
  assert.equal(
    f.get("/accounts").find((a) => a.id === account.id).balanceMinor,
    100000,
  );
  f.post(
    "/payments",
    payment(account, bill, {
      amountMinor: 100000,
      externalReference: "",
      idempotencyKey: "payment-final",
    }),
  );
  const savedBill = f.get("/bills").find((b) => b.id === bill.id);
  assert.equal(savedBill.status, "paid");
  assert.equal(savedBill.paidMinor, 150000);
  assert.equal(savedBill.balanceMinor, 0);
  const summary = f.get("/dashboard");
  assert.equal(summary.total_billed_minor, initial.total_billed_minor + 150000);
  assert.equal(
    summary.total_collected_minor,
    initial.total_collected_minor + 150000,
  );
  assert.equal(summary.outstanding_minor, initial.outstanding_minor);
  assert.deepEqual(
    createDemoStore(f.config).request("/bills", {}, admin),
    f.get("/bills"),
  );
  assert.equal(f.get("/audit").length, 7);
});

test("AC4 payment replays survive reload without another receipt or audit; conflicting payload fails", () => {
  const f = fixture();
  const { account, bill } = journey(f);
  const input = payment(account, bill);
  const original = f.post("/payments", input);
  const audit = f.get("/audit").length;
  assert.deepEqual(
    createDemoStore(f.config).request(
      "/payments",
      { method: "POST", body: input },
      admin,
    ),
    original,
  );
  assert.equal(f.get("/audit").length, audit);
  for (const changed of [
    { amountMinor: 1 },
    { method: "cash" },
    { externalReference: "OTHER" },
    { billId: "other" },
    { serviceAccountId: "other" },
  ]) {
    assert.throws(
      () => f.post("/payments", { ...input, ...changed }),
      /idempotency key/,
    );
  }
  assert.throws(
    () => f.post("/payments", { ...input, idempotencyKey: "second" }),
    /reference already exists/,
  );
  assert.equal(f.get("/bills").find((b) => b.id === bill.id).paidMinor, 50000);
});

test("AC3 reading and bill replays do not duplicate or change balances", () => {
  const f = fixture();
  const { readingInput, billInput, reading, bill } = journey(f);
  const before = f.get("/audit").length;
  assert.deepEqual(f.post("/readings", readingInput), reading);
  assert.deepEqual(f.post("/bills/generate", billInput), bill);
  assert.equal(f.get("/audit").length, before);
  assert.throws(
    () => f.post("/readings", { ...readingInput, currentReading: 69 }),
    /idempotency key/,
  );
  assert.throws(
    () => f.post("/bills/generate", { ...billInput, dueAt: "2026-10-26" }),
    /already billed/,
  );
});

test("AC3 chronological and precision rules reject stale, regressing, future and malformed readings", () => {
  const f = fixture();
  const { account } = journey(f);
  const base = {
    serviceAccountId: account.id,
    previousReading: 68,
    currentReading: 70,
    readAt: "2026-10-11",
    idempotencyKey: "next",
  };
  for (const changed of [
    { previousReading: 50 },
    { currentReading: 67 },
    { readAt: "2026-10-09" },
    { readAt: "2026-10-12" },
    { readAt: "2026-02-30" },
    { currentReading: 70.0001 },
    { currentReading: -1 },
    { currentReading: "70" },
    { currentReading: 1e15 },
    { idempotencyKey: "" },
  ]) {
    assert.throws(() => f.post("/readings", { ...base, ...changed }));
  }
  assert.equal(
    f.get("/accounts").find((a) => a.id === account.id).lastReading,
    68,
  );
  assert.equal(f.post("/readings", base).consumption, 2);
});

test("AC3 bill periods validate order, due date, reading inclusion, account ownership and overlap", () => {
  const f = fixture();
  const { account, billInput } = journey(f);
  const reading = f.post("/readings", {
    serviceAccountId: account.id,
    previousReading: 68,
    currentReading: 70,
    readAt: "2026-10-11",
    idempotencyKey: "next",
  });
  const base = {
    ...billInput,
    meterReadingId: reading.id,
    periodStart: "2026-10-10",
    periodEnd: "2026-10-11",
  };
  assert.throws(() => f.post("/bills/generate", base), /overlaps/);
  for (const changed of [
    { periodStart: "2026-10-12" },
    { dueAt: "2026-10-10" },
    { periodEnd: "2026-10-10" },
    { serviceAccountId: "demo-account-0001" },
    { periodStart: "2026-02-30" },
  ]) {
    assert.throws(() => f.post("/bills/generate", { ...base, ...changed }));
  }
  assert.equal(
    f.post("/bills/generate", { ...base, periodStart: "2026-10-11" })
      .totalMinor,
    30000,
  );
});

test("AC3 fractional water units use exact half-up rounding to cents", () => {
  const f = fixture();
  const customer = f.get("/customers")[0];
  const account = f.post("/accounts", {
    customerId: customer.id,
    tariffId: "tariff-domestic",
    accountNumber: "FRACTION",
    meterNumber: "FRACTION",
  });
  const reading = f.post("/readings", {
    serviceAccountId: account.id,
    previousReading: 0,
    currentReading: 0.001,
    readAt: "2026-10-10",
    idempotencyKey: "fraction",
  });
  const bill = f.post("/bills/generate", {
    serviceAccountId: account.id,
    meterReadingId: reading.id,
    periodStart: "2026-10-01",
    periodEnd: "2026-10-10",
    dueAt: "2026-10-11",
  });
  assert.equal(bill.totalMinor, 15008);
});

test("AC4 rejects invalid, unsafe and excessive payments and mismatched account links", () => {
  const f = fixture();
  const { account, bill } = journey(f);
  for (const amountMinor of [
    0,
    -1,
    1.5,
    "100",
    Number.MAX_SAFE_INTEGER + 1,
    150001,
  ]) {
    assert.throws(() =>
      f.post("/payments", payment(account, bill, { amountMinor })),
    );
  }
  assert.throws(
    () =>
      f.post(
        "/payments",
        payment(account, bill, { serviceAccountId: "demo-account-0001" }),
      ),
    /Bill not found/,
  );
  assert.throws(
    () => f.post("/payments", payment(account, bill, { method: "crypto" })),
    /supported payment/,
  );
  assert.equal(f.get("/bills").find((b) => b.id === bill.id).paidMinor, 0);
});

test("AC2 unique customer, account and meter identifiers and required linkage are enforced", () => {
  const f = fixture();
  const { customer } = journey(f);
  assert.throws(
    () =>
      f.post("/customers", {
        customerNumber: " cus-new ",
        fullName: "Duplicate",
      }),
    /already exists/,
  );
  assert.throws(
    () => f.post("/customers", { customerNumber: "OTHER", fullName: " " }),
    /customer name/,
  );
  const base = {
    customerId: customer.id,
    tariffId: "tariff-domestic",
    accountNumber: "OTHER",
    meterNumber: "OTHER",
  };
  for (const changed of [
    { accountNumber: "acc-new" },
    { meterNumber: "mtr-new" },
    { customerId: "missing" },
    { tariffId: "missing" },
    { initialReading: -1 },
  ])
    assert.throws(() => f.post("/accounts", { ...base, ...changed }));
});

test("AC6 every mutation denies roles outside the matrix; all valid roles may read", () => {
  const f = fixture();
  const allowed = {
    "/customers": [],
    "/accounts": [],
    "/readings": ["reader"],
    "/bills/generate": ["accountant"],
    "/payments": ["cashier"],
  };
  for (const role of ["reader", "cashier", "accountant"]) {
    const context = { ...admin, role };
    assert.equal(f.get("/customers", context).length, 6);
    for (const [path, permitted] of Object.entries(allowed))
      if (!permitted.includes(role))
        assert.throws(() => f.post(path, {}, context), /cannot perform/);
  }
  for (const context of [
    undefined,
    { ...admin, role: "viewer" },
    { ...admin, tenantId: "foreign" },
  ]) {
    assert.throws(() => f.store.request("/customers", {}, context));
    assert.throws(() =>
      f.store.request("/customers", { method: "POST", body: {} }, context),
    );
  }
  const { account, bill } = journey(f);
  f.post(
    "/readings",
    {
      serviceAccountId: account.id,
      previousReading: 68,
      currentReading: 69,
      readAt: "2026-10-11",
      idempotencyKey: "reader-write",
    },
    { ...admin, role: "reader" },
  );
  f.post("/payments", payment(account, bill), { ...admin, role: "cashier" });
  assert.equal(f.get("/audit")[0].actorRole, "cashier");
});

test("AC6 storage failure leaves persisted balances and records unchanged and permits a safe retry", () => {
  const f = fixture();
  const { account, bill } = journey(f);
  const before = f.storage.getItem(DEMO_STORAGE_KEY);
  const save = f.storage.setItem;
  f.storage.setItem = () => {
    throw new Error("Quota");
  };
  assert.throws(
    () => f.post("/payments", payment(account, bill)),
    /No changes were applied/,
  );
  assert.equal(f.storage.getItem(DEMO_STORAGE_KEY), before);
  assert.equal(f.get("/bills").find((b) => b.id === bill.id).paidMinor, 0);
  f.storage.setItem = save;
  f.post("/payments", payment(account, bill));
  assert.equal(f.get("/bills").find((b) => b.id === bill.id).paidMinor, 50000);
});

test("AC6 damaged storage fails visibly without overwrite and explicit reset recovers", () => {
  const f = fixture();
  for (const raw of ["{bad json", "{}", JSON.stringify({ version: 2 })]) {
    f.storage.setItem(DEMO_STORAGE_KEY, raw);
    assert.throws(() => f.get("/dashboard"), /Reset the demo/);
    assert.throws(
      () => f.post("/customers", { customerNumber: "X", fullName: "X" }),
      /Reset the demo/,
    );
    assert.equal(f.storage.getItem(DEMO_STORAGE_KEY), raw);
  }
  f.store.reset();
  assert.equal(f.get("/customers").length, 6);
  const state = JSON.parse(f.storage.getItem(DEMO_STORAGE_KEY));
  state.bills[0].balanceMinor += 1;
  f.storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  assert.throws(() => f.get("/bills"), /Reset the demo/);
  f.store.reset();
  assert.equal(f.get("/bills")[0].balanceMinor, 0);
});

test("GET does not write storage and consumers cannot mutate the ledger through returned objects", () => {
  const f = fixture();
  assert.equal(f.get("/customers").length, 6);
  assert.equal(f.storage.getItem(DEMO_STORAGE_KEY), null);
  const { bill } = journey(f);
  const returned = f.get("/bills");
  returned[0].balanceMinor = 1;
  assert.equal(
    f.get("/bills").find((b) => b.id === bill.id).balanceMinor,
    150000,
  );
});

test("new receipt numbers never collide with sparse seeded receipt numbers", () => {
  const data = new Map();
  const store = createDemoStore({
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  });
  const context = { role: "admin", tenantId: DEMO_TENANT_ID };
  const bill = store
    .request("/bills", {}, context)
    .find((b) => b.balanceMinor > 0);
  store.request(
    "/payments",
    {
      method: "POST",
      body: {
        serviceAccountId: bill.serviceAccountId,
        billId: bill.id,
        amountMinor: 100,
        method: "cash",
        idempotencyKey: "receipt-collision-check",
      },
    },
    context,
  );
  const receipts = store
    .request("/payments", {}, context)
    .map((p) => p.receiptNumber);
  assert.equal(new Set(receipts).size, receipts.length);
});
