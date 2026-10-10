import { escapeHtml } from '../lib/format.js';

export function table(headers, rows, empty, className = '') {
  return `<div class="table-wrap"><table class="${className}"><thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td class="empty-cell" colspan="${headers.length}">${escapeHtml(empty)}</td></tr>`}</tbody></table></div>`;
}