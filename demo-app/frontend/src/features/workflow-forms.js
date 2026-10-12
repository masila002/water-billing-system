import { calculateBillMinor } from "../lib/billing.js";
import { field, openDialog } from "../components/dialog.js";
import { setToast } from "../components/toast.js";
import { escapeHtml as esc, formatMoney } from "../lib/format.js";
import { request } from "../lib/api.js";
const option = (id, text) => `<option value="${esc(id)}">${esc(text)}</option>`;
const select = (label, name, options) =>
  `<label class="form-field form-field-wide"><span>${label} <b>*</b></span><select name="${name}" required>${options}</select></label>`;
const post = (state, path, body) =>
  request(state, path, { method: "POST", body: JSON.stringify(body) });
export function openAccountForm(state, afterSaved) {
  if (!state.data.customers.length)
    return setToast("Add a customer before creating a service account.", true);
  openDialog({
    title: "Connect a meter",
    subtitle:
      "Link a customer to a service account and an illustrative tariff.",
    submitLabel: "Create account",
    content: `<div class="form-grid">${select("Customer", "customerId", state.data.customers.map((c) => option(c.id, `${c.customerNumber} · ${c.fullName}`)).join(""))}${field("Account number", "accountNumber", "text", "ACC-0100", true)}${field("Meter number", "meterNumber", "text", "MTR-0100", true)}${select("Demo tariff", "tariffId", state.data.tariffs.map((t) => option(t.id, `${t.name}: ${formatMoney(t.ratePerUnitMinor)}/m³ + ${formatMoney(t.fixedChargeMinor)} fixed`)).join(""))}${field("Opening meter reading (m³)", "initialReading", "number", "0", true)}</div>`,
    onSubmit: (form) =>
      post(state, "/accounts", {
        ...Object.fromEntries(form),
        initialReading: Number(form.get("initialReading")),
      }),
    onSaved: afterSaved,
  });
  const reading = document.querySelector('[name="initialReading"]');
  reading.value = "0";
  reading.min = "0";
  reading.step = "0.001";
}
export function openReadingForm(state, afterSaved) {
  const accounts = state.data.accounts.filter((a) => a.status === "active");
  if (!accounts.length)
    return setToast("Create an active metered account first.", true);
  const key = crypto.randomUUID();
  openDialog({
    title: "Capture a meter reading",
    subtitle:
      "Review the usage and estimated bill. Saving the reading creates the invoice.",
    submitLabel: "Save reading",
    content: `<div class="form-grid">${select("Service account", "serviceAccountId", accounts.map((a) => option(a.id, `${a.accountNumber} · ${a.customerName} · ${a.meterNumber}`)).join(""))}<div class="calculation form-field-wide" id="reading-preview"></div>${field("Current reading (m³)", "currentReading", "number", "Enter cumulative meter value", true)}${field("Reading date", "readAt", "date", "", true)}${field("Field notes", "notes", "text", "Optional observation")}</div>`,
    onSubmit: (form) => {
      const account = accounts.find(
        (a) => a.id === form.get("serviceAccountId"),
      );
      return post(state, "/readings", {
        serviceAccountId: account.id,
        previousReading: Number(account.lastReading || 0),
        currentReading: Number(form.get("currentReading")),
        readAt: form.get("readAt"),
        notes: form.get("notes") || undefined,
        idempotencyKey: key,
      });
    },
    onSaved: async (result) => {
      await afterSaved();
      if (result.generatedBill)
        setToast(
          `Reading saved. ${result.generatedBill.billNumber} for ${formatMoney(result.generatedBill.totalMinor)} is now in Bills.`,
        );
    },
  });
  const date = document.querySelector('[name="readAt"]');
  date.value = new Date().toISOString().slice(0, 10);
  date.max = date.value;
  const input = document.querySelector('[name="currentReading"]');
  input.step = "0.001";
  input.min = "0";
  const update = () => {
    const a = accounts.find(
      (a) => a.id === document.querySelector('[name="serviceAccountId"]').value,
    );
    const previous = Number(a.lastReading || 0);
    const current = Number(input.value);
    input.min = String(previous);
    const preview = document.querySelector("#reading-preview");
    if (!input.value) {
      preview.textContent = `Previous: ${previous} m³ · Consumption: — · Estimated bill: —`;
      return;
    }
    if (!Number.isFinite(current) || current < previous) {
      preview.textContent = `Previous: ${previous} m³ · Current reading must be at least ${previous} m³.`;
      return;
    }
    const tariff = state.data.tariffs.find((item) => item.id === a.tariffId);
    const total = calculateBillMinor(
      previous,
      current,
      tariff.ratePerUnitMinor,
      tariff.fixedChargeMinor,
    );
    preview.textContent =
      `Previous: ${previous} m³ · Consumption: ${(current - previous).toFixed(3)} m³ · Estimated bill: ${formatMoney(total)}. Demo tariff.`;
  };
  document
    .querySelector('[name="serviceAccountId"]')
    .addEventListener("change", update);
  input.addEventListener("input", update);
  update();
}
export function openBillForm(state, afterSaved) {
  const readings = state.data.readings.filter(
    (r) => !state.data.bills.some((b) => b.meterReadingId === r.id),
  );
  if (!readings.length)
    return setToast("Capture a new meter reading before issuing a bill.", true);
  openDialog({
    title: "Issue a water bill",
    subtitle: "Review usage and the illustrative tariff before issuing.",
    submitLabel: "Issue bill",
    content: `<div class="form-grid">${select("Unbilled reading", "meterReadingId", readings.map((r) => option(r.id, `${r.accountNumber} · ${r.customerName} · ${r.consumption} m³`)).join(""))}<div class="calculation form-field-wide" id="bill-preview"></div>${field("Period start", "periodStart", "date", "", true)}${field("Period end", "periodEnd", "date", "", true)}${field("Payment due", "dueAt", "date", "", true)}</div>`,
    onSubmit: (form) => {
      const reading = readings.find((r) => r.id === form.get("meterReadingId"));
      return post(state, "/bills/generate", {
        ...Object.fromEntries(form),
        serviceAccountId: reading.serviceAccountId,
      });
    },
    onSaved: afterSaved,
  });
  const update = () => {
    const r = readings.find(
      (r) => r.id === document.querySelector('[name="meterReadingId"]').value,
    );
    const a = state.data.accounts.find((a) => a.id === r.serviceAccountId);
    const t = state.data.tariffs.find((t) => t.id === a.tariffId);
    const d = new Date(r.readAt);
    const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const due = new Date(last);
    due.setUTCDate(due.getUTCDate() + 14);
    for (const [name, value] of Object.entries({
      periodStart: first,
      periodEnd: last,
      dueAt: due,
    }))
      document.querySelector(`[name="${name}"]`).value = value
        .toISOString()
        .slice(0, 10);
    const total = calculateBillMinor(
      r.previousReading,
      r.currentReading,
      t.ratePerUnitMinor,
      t.fixedChargeMinor,
    );
    document.querySelector("#bill-preview").textContent =
      `${r.consumption} m³ × ${formatMoney(t.ratePerUnitMinor)} + ${formatMoney(t.fixedChargeMinor)} service charge = ${formatMoney(total)}. Demo tariff, not an approved utility rate.`;
  };
  document
    .querySelector('[name="meterReadingId"]')
    .addEventListener("change", update);
  update();
}
