import { can } from "../app/state.js";
import { icon } from "../components/icons.js";
import { table } from "../components/table.js";
import { badge, escapeHtml, formatDate, formatMoney } from "../lib/format.js";

function metric(label, value, note, iconName, tint) {
  return `<article class="metric metric-${tint}"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(iconName)}</span></div><strong class="metric-value">${escapeHtml(value)}</strong><div class="metric-note"><span class="metric-swatch"></span>${note}</div></article>`;
}

export function renderDashboard(state) {
  const summary = state.data.summary || {};
  const recent = state.data.payments
    .slice(0, 5)
    .map(
      (payment) => `
    <tr><td><span class="customer-cell"><span class="table-avatar">${escapeHtml((payment.customerName || "?").slice(0, 1))}</span><span><strong>${escapeHtml(payment.customerName)}</strong><small>${escapeHtml(payment.accountNumber || payment.receiptNumber)}</small></span></span></td><td>${escapeHtml(payment.method)}</td><td><span class="amount">${formatMoney(payment.amountMinor)}</span></td><td>${badge(payment.status)}</td><td>${formatDate(payment.paidAt)}</td></tr>`,
    )
    .join("");
  const dueBills = state.data.bills
    .filter((bill) =>
      ["issued", "partially_paid", "overdue"].includes(bill.status),
    )
    .slice(0, 4)
    .map(
      (bill) => `
    <tr><td><span class="invoice-number">${escapeHtml(bill.billNumber)}</span></td><td>${escapeHtml(bill.customerName)}</td><td>${escapeHtml(bill.accountNumber)}</td><td><span class="amount">${formatMoney(bill.balanceMinor ?? bill.totalMinor)}</span></td><td>${badge(bill.status)}</td></tr>`,
    )
    .join("");
  return `
    <div class="page-heading"><div><p class="eyebrow">${escapeHtml(new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase())} <span class="eyebrow-dot"></span> NAKURU COUNTY</p><h1>Your water network<span class="heading-period">.</span></h1><p class="page-subtitle">A clear view of customers, billing and collections.</p></div><div class="heading-actions"><button class="button button-quiet" data-action="refresh">${icon("refresh")}<span>Refresh data</span></button>${can(state, "add-customer") ? `<button class="button button-primary" data-action="add-customer">${icon("plus")}<span>New customer</span></button>` : ""}</div></div>
    ${state.connected ? "" : `<div class="notice notice-warning"><span class="notice-mark">!</span><div><strong>Workspace data unavailable</strong><p>${escapeHtml(state.error || "Loading your workspace…")}</p></div><button class="text-button" data-action="settings">Review settings ${icon("arrow")}</button></div>`}
    ${state.mode === "demo" ? `<section class="workflow-strip" aria-label="Demo workflow"><div><p class="eyebrow">THE COMPLETE BILLING CYCLE</p><strong>From connection to collection</strong></div><div class="workflow-steps"><button data-view="customers">01 <span>Register</span> →</button><button data-view="accounts">02 <span>Connect</span> →</button><button data-view="readings">03 <span>Read</span> →</button><button data-view="bills">04 <span>Bill</span> →</button><button data-view="payments">05 <span>Collect</span></button></div></section>` : ""}
    <section class="metric-grid" aria-label="Utility summary">
      ${metric("Active customers", summary.active_customers ?? "—", "Customers with service", "customers", "mint")}
      ${metric("Active accounts", summary.active_accounts ?? "—", "Connected service points", "accounts", "blue")}
      ${metric("Total billed", summary.total_billed_minor === undefined ? "—" : formatMoney(summary.total_billed_minor), "All issued bills", "bills", "gold")}
      ${metric("Collected", summary.total_collected_minor === undefined ? "—" : formatMoney(summary.total_collected_minor), "Confirmed payments", "payments", "coral")}
    </section>
    <section class="overview-grid">
      <article class="panel payments-panel"><div class="panel-heading"><div><p class="eyebrow">CASH FLOW</p><h2>Recent payments</h2></div><button class="link-button" data-view="payments">All payments ${icon("arrow")}</button></div>
        ${table(["CUSTOMER", "METHOD", "AMOUNT", "STATUS", "DATE"], recent, "No payments recorded. Issue a bill, then record its payment.")}
      </article>
      <article class="panel collection-panel"><div class="panel-heading"><div><p class="eyebrow">BILLING SNAPSHOT</p><h2>Outstanding bills</h2></div><span class="open-bills"><span></span>${escapeHtml(summary.unpaid_bills ?? "—")} open</span></div>
        ${table(["INVOICE", "CUSTOMER", "ACCOUNT", "AMOUNT", "STATUS"], dueBills, "No outstanding bills found.")}
      </article>
      <aside class="insight-panel"><div class="insight-top"><span class="insight-spark">✳</span><span class="eyebrow">COLLECTIONS AT A GLANCE</span><span class="live-label"><i></i> DEMO</span></div><h2>Every drop,<br>accounted for.</h2><p>Keep customer records and collections in sync with a clear view of daily operations.</p><div class="insight-stats"><span><strong>${escapeHtml(summary.unpaid_bills ?? "—")}</strong><small>Open bills</small></span><span><strong>${summary.total_billed_minor ? Math.round((Number(summary.total_collected_minor) / Number(summary.total_billed_minor)) * 100) : 0}%</strong><small>Collection rate</small></span></div><div class="pulse-line">${"<span></span>".repeat(17)}</div></aside>
    </section>
    <footer class="page-footer"><a href="https://404-hub-spot.vercel.app/" target="_blank" rel="noopener noreferrer">Powered by 404HubSpot ↗</a><span>${state.connected ? `Updated ${new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : "Not connected"}</span></footer>`;
}
