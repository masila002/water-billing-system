import { table } from '../components/table.js';
import { icon } from '../components/icons.js';
import { badge, escapeHtml, formatDate, formatMoney } from '../lib/format.js';

const configurations = {
  customers: {
    title: 'Customers', eyebrow: 'CUSTOMER REGISTER', description: 'Manage customer records across your utility.', action: 'New customer',
    columns: ['CUSTOMER', 'CUSTOMER NO.', 'PHONE', 'EMAIL', 'LOCATION', 'STATUS'], dataKey: 'customers', empty: 'No customers found.',
    row: (item) => `<tr><td><span class="customer-cell"><span class="table-avatar">${escapeHtml((item.fullName || '?').slice(0, 1))}</span><strong>${escapeHtml(item.fullName)}</strong></span></td><td>${escapeHtml(item.customerNumber)}</td><td>${escapeHtml(item.phone || '—')}</td><td>${escapeHtml(item.email || '—')}</td><td>${escapeHtml(item.address || '—')}</td><td>${badge(item.status)}</td></tr>`,
  },
  accounts: {
    title: 'Service accounts', eyebrow: 'CONNECTION REGISTER', description: 'Meters, service points, and their account holders.',
    columns: ['ACCOUNT', 'CUSTOMER', 'METER', 'TARIFF', 'STATUS'], dataKey: 'accounts', empty: 'No service accounts found.',
    row: (item) => `<tr><td><span class="invoice-number">${escapeHtml(item.accountNumber)}</span></td><td>${escapeHtml(item.customerName)}</td><td>${escapeHtml(item.meterNumber)}</td><td>${escapeHtml(item.tariffName)}</td><td>${badge(item.status)}</td></tr>`,
  },
  bills: {
    title: 'Bills', eyebrow: 'BILLING REGISTER', description: 'Issued invoices and outstanding balances.',
    columns: ['INVOICE', 'CUSTOMER', 'ACCOUNT', 'PERIOD', 'DUE DATE', 'TOTAL', 'STATUS'], dataKey: 'bills', empty: 'No bills found.',
    row: (item) => `<tr><td><span class="invoice-number">${escapeHtml(item.billNumber)}</span></td><td>${escapeHtml(item.customerName)}</td><td>${escapeHtml(item.accountNumber)}</td><td>${formatDate(item.periodStart)} – ${formatDate(item.periodEnd)}</td><td>${formatDate(item.dueAt)}</td><td><span class="amount">${formatMoney(item.totalMinor)}</span></td><td>${badge(item.status)}</td></tr>`,
  },
  payments: {
    title: 'Payments', eyebrow: 'COLLECTIONS REGISTER', description: 'Confirmed receipts and recorded customer payments.', action: 'Record payment',
    columns: ['RECEIPT', 'CUSTOMER', 'ACCOUNT', 'METHOD', 'REFERENCE', 'DATE', 'AMOUNT', 'STATUS'], dataKey: 'payments', empty: 'No payments found.',
    row: (item) => `<tr><td><span class="invoice-number">${escapeHtml(item.receiptNumber)}</span></td><td>${escapeHtml(item.customerName)}</td><td>${escapeHtml(item.accountNumber)}</td><td>${escapeHtml(item.method)}</td><td>${escapeHtml(item.externalReference || '—')}</td><td>${formatDate(item.paidAt)}</td><td><span class="amount">${formatMoney(item.amountMinor)}</span></td><td>${badge(item.status)}</td></tr>`,
  },
};

export function renderRecords(state, view) {
  const config = configurations[view];
  const data = state.data[config.dataKey];
  return `<div class="page-heading"><div><p class="eyebrow">${config.eyebrow}</p><h1>${config.title}<span class="heading-period">.</span></h1><p class="page-subtitle">${config.description}</p></div><div class="heading-actions"><button class="button button-quiet" data-action="refresh">${icon('refresh')}<span>Refresh data</span></button>${config.action ? `<button class="button button-primary" data-action="${view === 'payments' ? 'record-payment' : 'add-customer'}">${icon('plus')}<span>${config.action}</span></button>` : ''}</div></div>
    ${state.connected ? '' : `<div class="notice notice-warning"><span class="notice-mark">!</span><div><strong>API connection unavailable</strong><p>Records will load as soon as the backend is reachable.</p></div><button class="text-button" data-action="settings">Review settings ${icon('arrow')}</button></div>`}
    <section class="panel list-panel"><div class="list-toolbar"><div class="list-count"><strong>${state.connected ? data.length : '—'}</strong><span>records</span></div><div class="list-tools"><label class="search-box"><span class="search-mark">⌕</span><input type="search" placeholder="Search ${config.title.toLowerCase()}" data-search="${view}" aria-label="Search ${config.title}" /></label></div></div>
    <div data-table>${table(config.columns, data.map(config.row).join(''), config.empty)}</div></section><footer class="page-footer"><span>MAJIBILL DEMO <b>·</b> FICTIONAL CUSTOMER DATA</span><span>${state.connected ? 'Connected to API' : 'Waiting for API'}</span></footer>`;
}

export function filterRecords(view, query, state) {
  const config = configurations[view];
  const data = state.data[config.dataKey];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = data.filter((record) => Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery)));
  return table(config.columns, matches.map(config.row).join(''), `No matching ${view}.`);
}