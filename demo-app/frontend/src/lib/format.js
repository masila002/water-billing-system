import { CURRENCY_CODE } from '../../../shared/constants.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function formatMoney(minor = 0) {
  const amount = Number(minor);
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: CURRENCY_CODE, maximumFractionDigits: 2,
  }).format((Number.isFinite(amount) ? amount : 0) / 100);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}

export function badge(value) {
  const label = String(value || 'unknown').replaceAll('_', ' ');
  return `<span class="badge badge-${escapeHtml(value)}">${escapeHtml(label)}</span>`;
}