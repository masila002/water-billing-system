import { NAV_ITEMS } from '../../../shared/constants.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../lib/format.js';

export function renderShell(state, { onNavigate, onSettings }) {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#overview" aria-label="MajiBill overview">
          <span class="brand-mark"><span></span><span></span><span></span></span>
          <span class="brand-name">maji<span>bill</span><small>UTILITY OPERATIONS</small></span>
        </a>
        <div class="utility-switch"><span class="utility-avatar">N</span><span><strong>Nakuru Water</strong><small>Demo utility</small></span><span class="switch-chevron">⌄</span></div>
        <p class="nav-label">WORKSPACE</p>
        <nav class="primary-nav" aria-label="Main navigation">
          ${NAV_ITEMS.map(({ id, label }) => `<button class="nav-link ${id === state.activeView ? 'active' : ''}" data-view="${id}">${icon(id)}<span>${label}</span>${id === 'bills' && state.data.summary?.unpaid_bills ? `<span class="nav-count">${escapeHtml(state.data.summary.unpaid_bills)}</span>` : ''}</button>`).join('')}
        </nav>
        <div class="sidebar-foot">
          <div class="water-note"><span class="water-note-mark">↗</span><div><strong>Service health</strong><small>All systems monitored</small></div><span class="health-dot"></span></div>
          <div class="profile"><span class="profile-avatar">DA</span><span><strong>Demo Admin</strong><small>Utility administrator</small></span><span class="profile-more">···</span></div>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="breadcrumb"><span>Workspace</span>${icon('arrow')}<strong>${NAV_ITEMS.find(({ id }) => id === state.activeView)?.label}</strong></div>
          <div class="top-actions"><span class="connection" id="connection"><i class="${state.connected ? '' : 'offline'}"></i><span>${state.connected ? 'API connected' : 'API offline'}</span></span><button class="icon-button" id="settings-button" aria-label="API settings" title="API settings">${icon('settings')}</button><button class="avatar-button" aria-label="Demo administrator">DA</button></div>
        </header>
        <main id="view" class="content"></main>
      </div>
    </div>
    <div id="dialog-root"></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>`;

  app.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => onNavigate(button.dataset.view)));
  app.querySelector('#settings-button').addEventListener('click', onSettings);
}