import { calculateBillMinor } from "./billing.js";
// Browser-only demonstration ledger. Never use it for live customer accounts.
export const DEMO_TENANT_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_STORAGE_KEY = "majibill-demo-v1";
const resources = [
  "customers",
  "accounts",
  "readings",
  "bills",
  "payments",
  "tariffs",
  "audit",
];
const roles = ["admin", "reader", "cashier", "accountant"];
const clone = (value) => JSON.parse(JSON.stringify(value));
function fail(message) {
  throw new Error(message);
}
function text(value, label, max = 120, optional = false) {
  if (optional && (value === undefined || value === null || value === ""))
    return "";
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`Enter a valid ${label}.`);
  return value.trim();
}
function decimal(value, label) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 999999999.999 ||
    !/^\d+(\.\d{1,3})?$/.test(String(value))
  )
    fail(`${label} must be nonnegative with at most three decimal places.`);
  return value;
}
function money(value) {
  if (!Number.isSafeInteger(value) || value < 1)
    fail("Payment amount must be a positive whole number of cents.");
  return value;
}
function date(value, label, dayOnly = false) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    fail(`Enter a valid ${label}.`);
  const day = value.slice(0, 10);
  if (
    new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day ||
    (dayOnly && value !== day)
  )
    fail(`Enter a valid ${label}.`);
  return dayOnly ? day : new Date(value).toISOString();
}
function safeTotal(values) {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n);
  if (total > BigInt(Number.MAX_SAFE_INTEGER))
    fail("Amount exceeds supported limits.");
  return Number(total);
}
function addDays(day, days) {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function readingBillPeriod(state, account, reading) {
  const lastBill = state.bills
    .filter((bill) => bill.serviceAccountId === account.id)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
  const previousReading = state.readings
    .filter((item) => item.serviceAccountId === account.id)
    .sort((a, b) => b.readAt.localeCompare(a.readAt))[0];
  const previousEnd =
    lastBill?.periodEnd ?? previousReading?.readAt.slice(0, 10);
  const readDay = reading.readAt.slice(0, 10);
  const periodStart = previousEnd
    ? addDays(previousEnd, 1)
    : `${readDay.slice(0, 7)}-01`;
  return {
    periodStart,
    periodEnd: readDay,
    dueAt: addDays(readDay, 14),
  };
}
function createReadingBill(state, account, reading, period, createdAt, id) {
  if (period.periodEnd < period.periodStart)
    fail("Reading date must be later than the last billed period.");
  if (
    state.bills.some(
      (bill) =>
        bill.serviceAccountId === account.id &&
        bill.periodStart <= period.periodEnd &&
        bill.periodEnd >= period.periodStart,
    )
  )
    fail("This billing period overlaps an existing bill.");
  const tariff =
    state.tariffs.find((item) => item.id === account.tariffId && item.isActive) ||
    fail("Active tariff not found.");
  const totalMinor = calculateBillMinor(
    reading.previousReading,
    reading.currentReading,
    tariff.ratePerUnitMinor,
    tariff.fixedChargeMinor,
  );
  const bill = {
    id: id(),
    serviceAccountId: account.id,
    accountNumber: account.accountNumber,
    customerName: account.customerName,
    meterReadingId: reading.id,
    billNumber: `INV-${createdAt.slice(0, 4)}-${String(state.bills.length + 1).padStart(4, "0")}`,
    ...period,
    consumption: reading.consumption,
    ratePerUnitMinor: tariff.ratePerUnitMinor,
    fixedChargeMinor: tariff.fixedChargeMinor,
    subtotalMinor: totalMinor,
    totalMinor,
    paidMinor: 0,
    balanceMinor: totalMinor,
    status: "issued",
    issuedAt: createdAt,
  };
  account.balanceMinor = safeTotal([account.balanceMinor, totalMinor]);
  state.bills.unshift(bill);
  return bill;
}
function seed() {
  const state = {
    version: 1,
    tenantId: DEMO_TENANT_ID,
    customers: [],
    accounts: [],
    readings: [],
    bills: [],
    payments: [],
    audit: [],
    tariffs: [
      {
        id: "tariff-domestic",
        name: "Domestic",
        ratePerUnitMinor: 7500,
        fixedChargeMinor: 15000,
        isActive: true,
      },
      {
        id: "tariff-commercial",
        name: "Commercial",
        ratePerUnitMinor: 10000,
        fixedChargeMinor: 25000,
        isActive: true,
      },
    ],
  };
  const names = [
    "Amani Mwangi",
    "Neema Otieno",
    "Baraka Kamau",
    "Imani Wanjiru",
    "Tumaini Njeri",
    "Upendo Ouma",
  ];
  names.forEach((fullName, index) => {
    const number = String(index + 1).padStart(4, "0");
    const customer = {
      id: `demo-customer-${number}`,
      customerNumber: `CUS-${number}`,
      fullName,
      phone: "",
      email: "",
      address: ["Milimani", "Lanet", "Naka"][index % 3],
      status: "active",
    };
    const consumption = [18, 24, 12, 30, 15, 21][index];
    const totalMinor = consumption * 7500 + 15000;
    const paidMinor =
      index === 0 || index === 3 ? totalMinor : index === 1 ? 90000 : 0;
    const account = {
      id: `demo-account-${number}`,
      customerId: customer.id,
      customerName: fullName,
      customerNumber: customer.customerNumber,
      accountNumber: `ACC-${number}`,
      meterNumber: `MTR-${number}`,
      tariffId: "tariff-domestic",
      tariffName: "Domestic",
      status: "active",
      lastReading: 100 + consumption,
      balanceMinor: totalMinor - paidMinor,
    };
    const reading = {
      id: `demo-reading-${number}`,
      serviceAccountId: account.id,
      accountNumber: account.accountNumber,
      customerName: fullName,
      previousReading: 100,
      currentReading: account.lastReading,
      consumption,
      readAt: "2026-09-30T09:00:00.000Z",
      notes: "Fictional demonstration reading",
      idempotencyKey: `seed-reading-${number}`,
    };
    const bill = {
      id: `demo-bill-${number}`,
      serviceAccountId: account.id,
      accountNumber: account.accountNumber,
      customerName: fullName,
      meterReadingId: reading.id,
      billNumber: `INV-2026-${number}`,
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      dueAt: "2026-10-15",
      issuedAt: "2026-10-01T08:00:00.000Z",
      consumption,
      ratePerUnitMinor: 7500,
      fixedChargeMinor: 15000,
      subtotalMinor: totalMinor,
      totalMinor,
      paidMinor,
      balanceMinor: totalMinor - paidMinor,
      status:
        paidMinor === totalMinor
          ? "paid"
          : paidMinor
            ? "partially_paid"
            : "issued",
    };
    state.customers.push(customer);
    state.accounts.push(account);
    state.readings.push(reading);
    state.bills.push(bill);
    if (paidMinor)
      state.payments.push({
        id: `demo-payment-${number}`,
        serviceAccountId: account.id,
        accountNumber: account.accountNumber,
        customerName: fullName,
        billId: bill.id,
        billNumber: bill.billNumber,
        receiptNumber: `RCT-2026-${number}`,
        amountMinor: paidMinor,
        method: index === 3 ? "cash" : "mpesa",
        externalReference: `DEMO${number}`,
        idempotencyKey: `seed-payment-${number}`,
        status: "confirmed",
        paidAt: "2026-10-05T10:00:00.000Z",
      });
  });
  state.audit.push({
    id: "demo-audit-seed",
    eventType: "demo.initialized",
    entityType: "demo",
    entityId: DEMO_TENANT_ID,
    role: "admin",
    actorRole: "admin",
    createdAt: "2026-10-01T08:00:00.000Z",
    details: "Fictional records loaded for the demonstration.",
  });
  return state;
}
function validateStored(state) {
  if (
    !state ||
    state.version !== 1 ||
    state.tenantId !== DEMO_TENANT_ID ||
    resources.some((key) => !Array.isArray(state[key]))
  )
    fail("Invalid saved data");
  for (const key of resources) {
    const ids = new Set();
    for (const item of state[key]) {
      if (!item || typeof item.id !== "string" || ids.has(item.id))
        fail("Invalid saved records");
      ids.add(item.id);
    }
  }
  const accounts = new Map(state.accounts.map((a) => [a.id, a]));
  const bills = new Map(state.bills.map((b) => [b.id, b]));
  for (const account of state.accounts) {
    if (
      !state.customers.some((c) => c.id === account.customerId) ||
      !state.tariffs.some((t) => t.id === account.tariffId)
    )
      fail("Invalid account link");
    decimal(account.lastReading, "Saved reading");
    if (!Number.isSafeInteger(account.balanceMinor) || account.balanceMinor < 0)
      fail("Invalid account balance");
  }
  for (const tariff of state.tariffs) {
    if (
      ![tariff.ratePerUnitMinor, tariff.fixedChargeMinor].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      )
    )
      fail("Invalid tariff");
  }
  for (const reading of state.readings) {
    if (!accounts.has(reading.serviceAccountId)) fail("Invalid reading link");
    decimal(reading.previousReading, "Saved reading");
    decimal(reading.currentReading, "Saved reading");
    date(reading.readAt, "reading date");
    if (reading.currentReading < reading.previousReading)
      fail("Invalid saved reading");
  }
  for (const bill of state.bills) {
    if (
      !accounts.has(bill.serviceAccountId) ||
      !state.readings.some(
        (r) =>
          r.id === bill.meterReadingId &&
          r.serviceAccountId === bill.serviceAccountId,
      )
    )
      fail("Invalid bill link");
    if (
      ![bill.totalMinor, bill.paidMinor, bill.balanceMinor].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      bill.paidMinor + bill.balanceMinor !== bill.totalMinor
    )
      fail("Invalid bill balance");
    date(bill.periodStart, "period start", true);
    date(bill.periodEnd, "period end", true);
    date(bill.dueAt, "due date", true);
    if (
      safeTotal(
        state.payments
          .filter((p) => p.billId === bill.id)
          .map((p) => p.amountMinor),
      ) !== bill.paidMinor
    )
      fail("Invalid payment balance");
  }
  for (const payment of state.payments) {
    money(payment.amountMinor);
    if (
      !bills.has(payment.billId) ||
      bills.get(payment.billId).serviceAccountId !== payment.serviceAccountId
    )
      fail("Invalid payment link");
  }
  for (const account of state.accounts)
    if (
      safeTotal(
        state.bills
          .filter((b) => b.serviceAccountId === account.id)
          .map((b) => b.balanceMinor),
      ) !== account.balanceMinor
    )
      fail("Invalid account balance");
  return state;
}

export function createDemoStore({
  storage,
  now = () => new Date(),
  id = () => globalThis.crypto.randomUUID(),
}) {
  const timestamp = () => new Date(now()).toISOString();
  // Read on every request so separate tabs do not silently reuse a stale in-memory ledger.
  function load() {
    let raw;
    try {
      raw = storage.getItem(DEMO_STORAGE_KEY);
    } catch {
      fail("Demo storage is unavailable. Allow browser storage and try again.");
    }
    if (raw === null) return seed();
    try {
      return validateStored(JSON.parse(raw));
    } catch {
      fail(
        "Saved demo data is damaged or incompatible. Reset the demo to recover.",
      );
    }
  }
  function save(state) {
    try {
      storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      fail(
        "Demo changes could not be saved. Free browser storage and try again. No changes were applied.",
      );
    }
  }
  function request(path, options = {}, context) {
    if (!context || !roles.includes(context.role))
      fail("Select a valid demo role.");
    if (context.tenantId !== DEMO_TENANT_ID)
      fail("This session cannot access the demo utility.");
    const method = (options.method || "GET").toUpperCase();
    const state = load();
    if (method === "GET") {
      if (path === "/dashboard") {
        const totalBilled = safeTotal(state.bills.map((b) => b.totalMinor));
        const totalCollected = safeTotal(
          state.payments.map((p) => p.amountMinor),
        );
        return {
          active_customers: state.customers.filter((c) => c.status === "active")
            .length,
          active_accounts: state.accounts.filter((a) => a.status === "active")
            .length,
          total_billed_minor: totalBilled,
          total_collected_minor: totalCollected,
          outstanding_minor: totalBilled - totalCollected,
          unpaid_bills: state.bills.filter((b) => b.balanceMinor > 0).length,
          recentPayments: clone(state.payments.slice(0, 5)),
        };
      }
      if (resources.includes(path.slice(1))) return clone(state[path.slice(1)]);
      fail("This demo page is unavailable.");
    }
    if (method !== "POST") fail("This action is unavailable in the demo.");
    const allowed = {
      "/customers": ["admin"],
      "/accounts": ["admin"],
      "/readings": ["admin", "reader"],
      "/bills/generate": ["admin", "accountant"],
      "/payments": ["admin", "cashier"],
    };
    if (!allowed[path]) fail("This action is unavailable in the demo.");
    if (!allowed[path].includes(context.role))
      fail(`The ${context.role} role cannot perform this action.`);
    let input;
    try {
      input =
        typeof options.body === "string"
          ? JSON.parse(options.body)
          : options.body;
    } catch {
      fail("The submitted data is invalid.");
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      fail("The submitted data is invalid.");
    const createdAt = timestamp();
    const findAccount = (accountId) =>
      state.accounts.find((a) => a.id === accountId) ||
      fail("Service account not found.");
    const unique = (list, field, value, label) => {
      if (
        list.some((item) => item[field]?.toLowerCase() === value.toLowerCase())
      )
        fail(`${label} already exists.`);
    };
    const identity = (account) => ({
      serviceAccountId: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
    });
    const replay = (list, key, normalized) => {
      const saved = list.find((item) => item.idempotencyKey === key);
      if (!saved) return null;
      if (
        Object.entries(normalized).some(
          ([field, value]) => (saved[field] ?? "") !== value,
        )
      )
        fail("This idempotency key was already used with different details.");
      return clone(saved);
    };
    let record;
    let generatedBill;
    let collection;
    let eventType;
    if (path === "/customers") {
      const customerNumber = text(input.customerNumber, "customer number", 80);
      unique(
        state.customers,
        "customerNumber",
        customerNumber,
        "Customer number",
      );
      record = {
        id: id(),
        customerNumber,
        fullName: text(input.fullName, "customer name", 200),
        phone: text(input.phone, "phone number", 40, true),
        email: text(input.email, "email address", 200, true),
        address: text(input.address, "location", 300, true),
        status: "active",
        createdAt,
      };
      if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))
        fail("Enter a valid email address.");
      collection = "customers";
      eventType = "customer.created";
    } else if (path === "/accounts") {
      const customer =
        state.customers.find((c) => c.id === input.customerId) ||
        fail("Customer not found.");
      const tariff =
        state.tariffs.find((t) => t.id === input.tariffId && t.isActive) ||
        fail("Active tariff not found.");
      const accountNumber = text(input.accountNumber, "account number", 80);
      const meterNumber = text(input.meterNumber, "meter number", 80);
      unique(state.accounts, "accountNumber", accountNumber, "Account number");
      unique(state.accounts, "meterNumber", meterNumber, "Meter number");
      record = {
        id: id(),
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.fullName,
        accountNumber,
        meterNumber,
        tariffId: tariff.id,
        tariffName: tariff.name,
        lastReading: decimal(input.initialReading ?? 0, "Initial reading"),
        balanceMinor: 0,
        status: "active",
        createdAt,
      };
      collection = "accounts";
      eventType = "account.created";
    } else if (path === "/readings") {
      const normalized = {
        serviceAccountId: text(input.serviceAccountId, "service account"),
        previousReading: decimal(input.previousReading, "Previous reading"),
        currentReading: decimal(input.currentReading, "Current reading"),
        readAt: date(input.readAt, "reading date"),
        notes: text(input.notes, "notes", 500, true),
      };
      const key = text(input.idempotencyKey, "idempotency key");
      const repeated = replay(state.readings, key, normalized);
      if (repeated) {
        const bill = state.bills.find((item) => item.meterReadingId === repeated.id);
        return bill ? { ...repeated, generatedBill: clone(bill) } : repeated;
      }
      const account = findAccount(normalized.serviceAccountId);
      if (account.status !== "active")
        fail("Only active accounts can receive readings.");
      if (normalized.previousReading !== account.lastReading)
        fail(
          "Previous reading does not match the latest recorded meter value.",
        );
      if (normalized.currentReading < normalized.previousReading)
        fail("Current reading cannot be lower than the previous reading.");
      if (
        state.readings.some(
          (r) =>
            r.serviceAccountId === account.id && r.readAt >= normalized.readAt,
        )
      )
        fail("Reading date must be later than the latest recorded reading.");
      if (normalized.readAt > createdAt)
        fail("Reading date cannot be in the future.");
      record = {
        id: id(),
        ...identity(account),
        ...normalized,
        consumption:
          (Math.round(normalized.currentReading * 1000) -
            Math.round(normalized.previousReading * 1000)) /
          1000,
        idempotencyKey: key,
        createdAt,
      };
      generatedBill = createReadingBill(
        state,
        account,
        record,
        readingBillPeriod(state, account, record),
        createdAt,
        id,
      );
      account.lastReading = normalized.currentReading;
      collection = "readings";
      eventType = "meter_reading.submitted";
    } else if (path === "/bills/generate") {
      const account = findAccount(input.serviceAccountId);
      const reading =
        state.readings.find(
          (r) =>
            r.id === input.meterReadingId && r.serviceAccountId === account.id,
        ) || fail("Meter reading not found for this account.");
      const periodStart = date(input.periodStart, "period start", true);
      const periodEnd = date(input.periodEnd, "period end", true);
      const dueAt = date(input.dueAt, "due date", true);
      if (periodEnd < periodStart)
        fail("Period end must be on or after the start.");
      if (dueAt < periodEnd)
        fail("Due date must be on or after the period end.");
      if (
        reading.readAt.slice(0, 10) < periodStart ||
        reading.readAt.slice(0, 10) > periodEnd
      )
        fail("Reading date must be within the billing period.");
      const previous = state.bills.find((b) => b.meterReadingId === reading.id);
      if (previous) {
        if (
          previous.periodStart !== periodStart ||
          previous.periodEnd !== periodEnd ||
          previous.dueAt !== dueAt
        )
          fail("This reading is already billed with different details.");
        return clone(previous);
      }
      if (
        state.bills.some(
          (b) =>
            b.serviceAccountId === account.id &&
            b.periodStart <= periodEnd &&
            b.periodEnd >= periodStart,
        )
      )
        fail("This billing period overlaps an existing bill.");
      const tariff =
        state.tariffs.find((t) => t.id === account.tariffId && t.isActive) ||
        fail("Active tariff not found.");
      const totalMinor = calculateBillMinor(
        reading.previousReading,
        reading.currentReading,
        tariff.ratePerUnitMinor,
        tariff.fixedChargeMinor,
      );
      const recordId = id();
      record = {
        id: recordId,
        ...identity(account),
        meterReadingId: reading.id,
        billNumber: `INV-${createdAt.slice(0, 4)}-${String(state.bills.length + 1).padStart(4, "0")}`,
        periodStart,
        periodEnd,
        dueAt,
        consumption: reading.consumption,
        ratePerUnitMinor: tariff.ratePerUnitMinor,
        fixedChargeMinor: tariff.fixedChargeMinor,
        subtotalMinor: totalMinor,
        totalMinor,
        paidMinor: 0,
        balanceMinor: totalMinor,
        status: "issued",
        issuedAt: createdAt,
      };
      account.balanceMinor = safeTotal([account.balanceMinor, totalMinor]);
      collection = "bills";
      eventType = "bill.generated";
    } else if (path === "/payments") {
      const normalized = {
        serviceAccountId: text(input.serviceAccountId, "service account"),
        billId: text(input.billId, "bill"),
        amountMinor: money(input.amountMinor),
        method: text(input.method, "payment method"),
        externalReference: text(
          input.externalReference,
          "payment reference",
          120,
          true,
        ),
      };
      if (!["mpesa", "cash", "bank", "other"].includes(normalized.method))
        fail("Choose a supported payment method.");
      const key = text(input.idempotencyKey, "idempotency key");
      const repeated = replay(state.payments, key, normalized);
      if (repeated) return repeated;
      const account = findAccount(normalized.serviceAccountId);
      const bill =
        state.bills.find(
          (b) =>
            b.id === normalized.billId && b.serviceAccountId === account.id,
        ) || fail("Bill not found for this account.");
      if (normalized.amountMinor > bill.balanceMinor)
        fail("Payment amount exceeds the outstanding balance.");
      if (normalized.externalReference)
        unique(
          state.payments,
          "externalReference",
          normalized.externalReference,
          "Payment reference",
        );
      record = {
        id: id(),
        ...identity(account),
        ...normalized,
        billNumber: bill.billNumber,
        receiptNumber: `RCT-${createdAt.slice(0, 4)}-${String(Math.max(0, ...state.payments.map((p) => Number(p.receiptNumber.split("-").at(-1)) || 0)) + 1).padStart(4, "0")}`,
        idempotencyKey: key,
        status: "confirmed",
        paidAt: createdAt,
      };
      bill.paidMinor += normalized.amountMinor;
      bill.balanceMinor -= normalized.amountMinor;
      bill.status = bill.balanceMinor === 0 ? "paid" : "partially_paid";
      account.balanceMinor -= normalized.amountMinor;
      collection = "payments";
      eventType = "payment.recorded";
    }
    state[collection].unshift(record);
    state.audit.unshift({
      id: id(),
      eventType,
      entityType: collection,
      entityId: record.id,
      role: context.role,
      actorRole: context.role,
      createdAt,
      details: `${eventType.replaceAll(".", " ")}: ${record.billNumber || record.accountNumber || record.customerNumber || record.id}`,
    });
    if (generatedBill)
      state.audit.unshift({
        id: id(),
        eventType: "bill.generated",
        entityType: "bills",
        entityId: generatedBill.id,
        role: context.role,
        actorRole: context.role,
        createdAt,
        details: `bill generated: ${generatedBill.billNumber}`,
      });
    save(state);
    return clone(
      generatedBill ? { ...record, generatedBill } : record,
    );
  }
  return {
    request,
    reset() {
      const state = seed();
      save(state);
      return clone(state);
    },
  };
}
