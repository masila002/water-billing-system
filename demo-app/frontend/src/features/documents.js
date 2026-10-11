import { openDialog } from "../components/dialog.js";
import { escapeHtml as esc, formatMoney, formatDate } from "../lib/format.js";
export function openDocument(state, type, id) {
  const item = state.data[type === "bill" ? "bills" : "payments"].find(
    (i) => i.id === id,
  );
  if (!item) return;
  const isBill = type === "bill";
  const reading = isBill
    ? state.data.readings.find((r) => r.id === item.meterReadingId)
    : null;
  const heading = isBill ? "Water bill" : "Payment receipt";
  openDialog({
    title: heading,
    subtitle:
      state.mode === "demo"
        ? "DEMONSTRATION DOCUMENT · No real payment or tax invoice"
        : "Local integration document",
    submitLabel: "Print document",
    content: `<article class="print-document"><div class="document-brand"><strong>majibill / Nakuru Demo Water</strong><span>Powered by 404HubSpot</span></div><h2>${esc(isBill ? item.billNumber : item.receiptNumber)}</h2><dl><dt>Customer</dt><dd>${esc(item.customerName)}</dd><dt>Account</dt><dd>${esc(item.accountNumber)}</dd>${isBill ? `<dt>Billing period</dt><dd>${formatDate(item.periodStart)} to ${formatDate(item.periodEnd)}</dd><dt>Payment due</dt><dd>${formatDate(item.dueAt)}</dd>${reading ? `<dt>Meter consumption</dt><dd>${esc(reading.currentReading)} − ${esc(reading.previousReading)} = ${esc(reading.consumption)} m³</dd>` : ""}${item.ratePerUnitMinor !== undefined ? `<dt>Consumption rate</dt><dd>${formatMoney(item.ratePerUnitMinor)}/m³</dd><dt>Fixed service charge</dt><dd>${formatMoney(item.fixedChargeMinor)}</dd>` : ""}<dt>Bill total</dt><dd>${formatMoney(item.totalMinor)}</dd><dt>Paid to date</dt><dd>${item.paidMinor === undefined ? "Unavailable" : formatMoney(item.paidMinor)}</dd><dt>Remaining balance</dt><dd>${item.balanceMinor === undefined ? "Unavailable" : formatMoney(item.balanceMinor)}</dd>` : `<dt>Received on</dt><dd>${formatDate(item.paidAt)}</dd><dt>Method</dt><dd>${esc(item.method)}${state.mode === "demo" ? " (simulated)" : ""}</dd><dt>Reference</dt><dd>${esc(item.externalReference || "Not provided")}</dd><dt>Amount received</dt><dd>${formatMoney(item.amountMinor)}</dd>`}<dt>Status</dt><dd>${esc(item.status.replaceAll("_", " "))}</dd></dl><p>Fictional demonstration data. For presentation purposes only.</p></article>`,
    onSubmit: () => window.print(),
  });
}
