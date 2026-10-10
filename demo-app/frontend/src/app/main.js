import '../styles/main.css';
import { openDialog } from '../components/dialog.js';
import { setToast } from '../components/toast.js';
import { renderDashboard } from '../features/dashboard.js';
import { openCustomerForm } from '../features/customer-form.js';
import { openPaymentForm } from '../features/payment-form.js';
import { renderRecords, filterRecords } from '../features/records.js';
import { openSettingsForm } from '../features/settings-form.js';
import { loadData, request } from '../lib/api.js';
import { state } from './state.js';
import { renderShell } from './shell.js';

function render() {
  renderShell(state, {
    onNavigate: (view) => {
      state.activeView = view;
      render();
    },
    onSettings: () => openSettingsForm(state, refreshData),
  });

  const view = document.querySelector('#view');
  view.innerHTML = state.activeView === 'overview'
    ? renderDashboard(state)
    : renderRecords(state, state.activeView);
  view.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    state.activeView = button.dataset.view;
    render();
  }));
  view.querySelector('[data-action="refresh"]')?.addEventListener('click', refreshData);
  view.querySelector('[data-action="add-customer"]')?.addEventListener('click', () => openCustomerForm(state, refreshData));
  view.querySelector('[data-action="record-payment"]')?.addEventListener('click', () => openPaymentForm(state, refreshData));
  view.querySelector('[data-action="settings"]')?.addEventListener('click', () => openSettingsForm(state, refreshData));
  view.querySelector('[data-search]')?.addEventListener('input', (event) => {
    document.querySelector('[data-table]').innerHTML = filterRecords(event.target.dataset.search, event.target.value, state);
  });
}

async function refreshData() {
  const failure = await loadData(state);
  render();
  if (failure) setToast(failure, true);
}

render();
refreshData();