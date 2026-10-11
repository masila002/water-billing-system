import { formatMoney, escapeHtml as esc } from "../lib/format.js";
import { table } from "../components/table.js";
export function renderReports(state) {
  if (state.error)
    return `<div class="page-heading"><div><h1>Reports unavailable</h1><p class="page-subtitle">Restore the workspace data connection to view accurate figures.</p></div></div><div class="notice notice-warning" role="alert">${esc(state.error)} <button class="text-button" data-action="settings">Review settings</button></div>`;
  const s = state.data.summary || {},
    billed = Number(s.total_billed_minor || 0),
    collected = Number(s.total_collected_minor || 0),
    rate = billed ? Math.round((collected / billed) * 100) : 0;
  const outstanding = state.data.accounts
    .filter((a) => Number(a.balanceMinor) > 0)
    .sort((a, b) => b.balanceMinor - a.balanceMinor);
  const methods = ["mpesa", "cash", "bank", "other"]
    .map((method) => {
      const total = state.data.payments
        .filter((p) => p.method === method && p.status === "confirmed")
        .reduce((s, p) => s + Number(p.amountMinor), 0);
      return `<div class="collection-row"><span>${esc(method === "mpesa" ? "M-Pesa (simulated)" : method)}</span><strong>${formatMoney(total)}</strong><meter min="0" max="${Math.max(collected, 1)}" value="${total}" aria-label="${esc(method)} collections"></meter></div>`;
    })
    .join("");
  return `<div class="page-heading"><div><p class="eyebrow">REVENUE VISIBILITY</p><h1>Know where you stand.</h1><p class="page-subtitle">All demo periods · Derived from issued bills and confirmed payment allocations.</p></div><button class="button button-primary" data-action="export">Export account balances</button></div><section class="metric-grid"><article class="metric metric-mint"><p>Total billed</p><strong class="metric-value">${formatMoney(billed)}</strong></article><article class="metric metric-blue"><p>Collected</p><strong class="metric-value">${formatMoney(collected)}</strong></article><article class="metric metric-gold"><p>Outstanding</p><strong class="metric-value">${formatMoney(billed - collected)}</strong></article><article class="metric metric-coral"><p>Collection rate</p><strong class="metric-value">${rate}%</strong></article></section><div class="report-grid"><section class="panel report-panel"><p class="eyebrow">PAYMENT CHANNELS</p><h2>Collections by method</h2>${methods}</section><section class="panel report-panel"><p class="eyebrow">FOLLOW-UP REGISTER</p><h2>Outstanding accounts</h2>${table(["ACCOUNT", "CUSTOMER", "BALANCE"], outstanding.map((a) => `<tr><td>${esc(a.accountNumber)}</td><td>${esc(a.customerName)}</td><td><strong>${formatMoney(a.balanceMinor)}</strong></td></tr>`).join(""), "All accounts are settled.")}</section></div>`;
}
export function downloadCSV(state) {
  const view = state.activeView === "reports" ? "accounts" : state.activeView;
  const query =
    document.querySelector("[data-search]")?.value.trim().toLowerCase() || "";
  const records = (state.data[view] || []).filter((r) =>
    Object.values(r).some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(query),
    ),
  );
  if (!records.length) throw new Error("There are no records to export.");
  const keys = Object.keys(records[0]).filter(
    (k) => !["idempotencyKey", "requestSignature"].includes(k),
  );
  const cell = (v) => {
    let text = String(v ?? "");
    if (/^[=+@\-\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const csv = [
    keys.map(cell).join(","),
    ...records.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `majibill-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
