import { icon } from '../components/icons.js';
import { table } from '../components/table.js';
import { badge, escapeHtml, formatDate, formatMoney } from '../lib/format.js';

function metric(label, value, note, iconName, tint) {
  return `<article class="metric metric-${tint}"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon(iconName)}</span></div><strong class="metric-value">${escapeHtml(value)}</strong><div class="metric-note"><span class="metric-swatch"></span>${note}</div></article>`;
}

export function renderDashboard(state) {
  const summary = state.data.summary || {};
  const recent = state.data.payments.slice(0, 5).map((payment) => `
    <tr><td><span class="customer-cell"><span class="table-avatar">${escapeHtml((payment.customerName || '?').slice(0, 1))}</span><span><strong>${escapeHtml(payment.customerName)}</strong><small>${escapeHtml(payment.accountNumber || payment.receiptNumber)}</small></span></span></td><td>${escapeHtml(payment.method)}</td><td><span class="amount">${formatMoney(payment.amountMinor)}</span></td><td>${badge(payment.status)}</td><td>${formatDate(payment.paidAt)}</td></tr>`).join('');
  const dueBills = state.data.bills.filter((bill) => ['issued', 'partially_paid', 'overdue'].includes(bill.status)).slice(0, 4).map((bill) => `
    <tr><td><span class="invoice-number">${escapeHtml(bill.billNumber)}</span></td><td>${escapeHtml(bill.customerName)}</td><td>${escapeHtml(bill.accountNumber)}</td><td><span class="amount">${formatMoney(bill.totalMinor)}</span></td><td>${badge(bill.status)}</td></tr>`).join('');
  return `
    <div class="page-heading"><div><p class="eyebrow">SATURDAY, OCTOBER 10, 2026 <span class="eyebrow-dot"></span> NAKURU COUNTY</p><h1>Good morning, Admin<span class="heading-period">.</span></h1><p class="page-subtitle">Here’s what’s happening across your water network today.</p></div><div class="heading-actions"><button class="button button-quiet" data-action="refresh">${icon('refresh')}<span>Refresh data</span></button><button class="button button-primary" data-action="add-customer">${icon('plus')}<span>New customer</span></button></div></div>
    ${state.connected ? '' : `<div class="notice notice-warning"><span class="notice-mark">!</span><div><strong>API connection unavailable</strong><p>Check that the NestJS API is running and your database is configured. Dashboard data will appear here after connecting.</p></div><button class="text-button" data-action="settings">Review settings ${icon('arrow')}</button></div>`}
    <section class="metric-grid" aria-label="Utility summary">
      ${metric('Active customers', summary.active_customers ?? '—', 'Customers with service', 'customers', 'mint')}
      ${metric('Active accounts', summary.active_accounts ?? '—', 'Connected service points', 'accounts', 'blue')}
      ${metric('Total billed', summary.total_billed_minor === undefined ? '—' : formatMoney(summary.total_billed_minor), 'All issued bills', 'bills', 'gold')}
      ${metric('Collected', summary.total_collected_minor === undefined ? '—' : formatMoney(summary.total_collected_minor), 'Confirmed payments', 'payments', 'coral')}
    </section>
    <section class="overview-grid">
      <article class="panel payments-panel"><div class="panel-heading"><div><p class="eyebrow">CASH FLOW</p><h2>Recent payments</h2></div><button class="link-button" data-view="payments">All payments ${icon('arrow')}</button></div>
        ${table(['CUSTOMER', 'METHOD', 'AMOUNT', 'STATUS', 'DATE'], recent, 'Payment records will appear here once the API is connected.')}
      </article>
      <article class="panel collection-panel"><div class="panel-heading"><div><p class="eyebrow">BILLING SNAPSHOT</p><h2>Outstanding bills</h2></div><span class="open-bills"><span></span>${escapeHtml(summary.unpaid_bills ?? '—')} open</span></div>
        ${table(['INVOICE', 'CUSTOMER', 'ACCOUNT', 'AMOUNT', 'STATUS'], dueBills, 'No outstanding bills found.')}
      </article>
      <aside class="insight-panel"><div class="insight-top"><span class="insight-spark">✳</span><span class="eyebrow">NETWORK PULSE</span><span class="live-label"><i></i> LIVE</span></div><h2>Every drop,<br>accounted for.</h2><p>Keep customer records and collections in sync with a clear view of daily operations.</p><div class="insight-stats"><span><strong>${escapeHtml(summary.unpaid_bills ?? '—')}</strong><small>Open bills</small></span><span><strong>${state.connected ? 'ON' : 'OFF'}</strong><small>API status</small></span></div><div class="pulse-line">${'<span></span>'.repeat(17)}</div></aside>
    </section>
    <footer class="page-footer"><span>MAJIBILL DEMO <b>·</b> FICTIONAL CUSTOMER DATA</span><span>${state.connected ? `Updated ${new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for API'}</span></footer>`;
}