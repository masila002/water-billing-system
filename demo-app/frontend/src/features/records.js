import { table } from "../components/table.js";
import { icon } from "../components/icons.js";
import {
  badge,
  escapeHtml as esc,
  formatDate,
  formatMoney,
} from "../lib/format.js";
import { can } from "../app/state.js";
const printButton = (type, item) =>
  `<button class="link-button" data-print="${type}" data-id="${esc(item.id)}">View / print</button>`;
export const configurations = {
  customers: {
    title: "Customers",
    eyebrow: "CUSTOMER REGISTER",
    description: "The people and businesses connected to your water network.",
    action: "New customer",
    actionId: "add-customer",
    columns: [
      "CUSTOMER",
      "CUSTOMER NO.",
      "PHONE",
      "EMAIL",
      "LOCATION",
      "STATUS",
    ],
    row: (c) =>
      `<tr><td><strong>${esc(c.fullName)}</strong></td><td>${esc(c.customerNumber)}</td><td>${esc(c.phone || "—")}</td><td>${esc(c.email || "—")}</td><td>${esc(c.address || "—")}</td><td>${badge(c.status)}</td></tr>`,
  },
  accounts: {
    title: "Service accounts",
    eyebrow: "CONNECTION REGISTER",
    description: "Every customer, meter and outstanding balance in one place.",
    action: "Connect a meter",
    actionId: "add-account",
    demoOnly: true,
    columns: [
      "ACCOUNT",
      "CUSTOMER",
      "METER",
      "TARIFF",
      "LAST READING",
      "BALANCE",
      "STATUS",
    ],
    row: (a) =>
      `<tr><td><strong>${esc(a.accountNumber)}</strong></td><td>${esc(a.customerName)}</td><td>${esc(a.meterNumber)}</td><td>${esc(a.tariffName)}</td><td>${esc(a.lastReading ?? "—")} m³</td><td>${a.balanceMinor === undefined ? "—" : formatMoney(a.balanceMinor)}</td><td>${badge(a.status)}</td></tr>`,
  },
  readings: {
    title: "Meter readings",
    eyebrow: "FIELD OPERATIONS",
    description:
      "Capture usage, catch errors and prepare accurate water bills.",
    action: "Capture reading",
    actionId: "add-reading",
    demoOnly: true,
    columns: [
      "ACCOUNT",
      "CUSTOMER",
      "PREVIOUS",
      "CURRENT",
      "CONSUMPTION",
      "READ ON",
    ],
    row: (r) =>
      `<tr><td><strong>${esc(r.accountNumber)}</strong></td><td>${esc(r.customerName)}</td><td>${esc(r.previousReading)}</td><td>${esc(r.currentReading)}</td><td><strong>${esc(r.consumption)} m³</strong></td><td>${formatDate(r.readAt)}</td></tr>`,
  },
  bills: {
    title: "Bills",
    eyebrow: "BILLING REGISTER",
    description: "From measured consumption to a clear, traceable invoice.",
    action: "Issue bill",
    actionId: "generate-bill",
    demoOnly: true,
    columns: [
      "INVOICE",
      "CUSTOMER",
      "ACCOUNT",
      "PERIOD",
      "DUE DATE",
      "TOTAL",
      "BALANCE",
      "STATUS",
      "DOCUMENT",
    ],
    row: (b) =>
      `<tr><td><strong>${esc(b.billNumber)}</strong></td><td>${esc(b.customerName)}</td><td>${esc(b.accountNumber)}</td><td>${formatDate(b.periodStart)} – ${formatDate(b.periodEnd)}</td><td>${formatDate(b.dueAt)}</td><td>${formatMoney(b.totalMinor)}</td><td>${b.balanceMinor === undefined ? "—" : formatMoney(b.balanceMinor)}</td><td>${badge(b.status)}</td><td>${printButton("bill", b)}</td></tr>`,
  },
  payments: {
    title: "Payments",
    eyebrow: "COLLECTIONS REGISTER",
    description: "Follow every recorded payment to its receipt.",
    action: "Record payment",
    actionId: "record-payment",
    columns: [
      "RECEIPT",
      "CUSTOMER",
      "ACCOUNT",
      "METHOD",
      "REFERENCE",
      "DATE",
      "AMOUNT",
      "STATUS",
      "DOCUMENT",
    ],
    row: (p) =>
      `<tr><td><strong>${esc(p.receiptNumber)}</strong></td><td>${esc(p.customerName)}</td><td>${esc(p.accountNumber)}</td><td>${esc(p.method)}</td><td>${esc(p.externalReference || "—")}</td><td>${formatDate(p.paidAt)}</td><td>${formatMoney(p.amountMinor)}</td><td>${badge(p.status)}</td><td>${printButton("receipt", p)}</td></tr>`,
  },
  audit: {
    title: "Activity log",
    eyebrow: "OPERATIONAL VISIBILITY",
    description:
      "Who recorded each demo action and when. Local history is editable, not a tamper-proof audit.",
    columns: ["WHEN", "PERSONA", "ACTION", "DETAILS"],
    row: (e) =>
      `<tr><td>${esc(new Date(e.createdAt).toLocaleString("en-KE"))}</td><td>${esc(e.actorRole || e.role)}</td><td>${esc(e.eventType?.replaceAll(".", " "))}</td><td>${esc(e.details)}</td></tr>`,
  },
};
export function renderRecords(state, view) {
  const c = configurations[view],
    data = state.data[view] || [];
  const action =
    c.action &&
    can(state, c.actionId) &&
    (!c.demoOnly || state.mode === "demo");
  return `<div class="page-heading"><div><p class="eyebrow">${c.eyebrow}</p><h1>${c.title}<span class="heading-period">.</span></h1><p class="page-subtitle">${c.description}</p></div><div class="heading-actions"><button class="button button-quiet" data-action="export">Export CSV</button>${action ? `<button class="button button-primary" data-action="${c.actionId}">${icon("plus")}${c.action}</button>` : ""}</div></div>${state.error ? `<div class="notice notice-warning" role="alert">${esc(state.error)} <button data-action="settings" class="text-button">Review settings</button></div>` : ""}
  <section class="panel list-panel"><div class="list-toolbar"><div class="list-count"><strong>${data.length}</strong><span>records</span></div><label class="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search ${c.title.toLowerCase()}" data-search="${view}" aria-label="Search ${c.title}" /></label></div><div data-table>${table(c.columns, data.map(c.row).join(""), `No ${c.title.toLowerCase()} yet. ${action ? `Use “${c.action}” to get started.` : "Ask an administrator to complete the preceding workflow step."}`)}</div></section>`;
}
export function filterRecords(view, query, state) {
  const c = configurations[view];
  const rows = (state.data[view] || []).filter((r) =>
    Object.values(r).some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ),
  );
  return table(
    c.columns,
    rows.map(c.row).join(""),
    `No matching ${c.title.toLowerCase()}. Try another search.`,
  );
}
