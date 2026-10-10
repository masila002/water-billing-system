import { openDialog } from '../components/dialog.js';
import { STORAGE_KEYS } from '../../../shared/constants.js';
import { escapeHtml } from '../lib/format.js';

export function openSettingsForm(state, afterSaved) {
  openDialog({
    title: 'API connection',
    subtitle: 'These settings stay in this browser on this device.',
    submitLabel: 'Connect',
    content: `<div class="form-grid"><label class="form-field form-field-wide"><span>API base URL <b>*</b></span><input name="apiBase" type="url" value="${escapeHtml(state.apiBase)}" required /></label><label class="form-field form-field-wide"><span>Tenant ID <b>*</b></span><input name="tenantId" type="text" value="${escapeHtml(state.tenantId)}" required /></label></div>`,
    onSubmit: async (form) => {
      state.apiBase = String(form.get('apiBase')).replace(/\/$/, '');
      state.tenantId = String(form.get('tenantId')).trim();
      localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
      localStorage.setItem(STORAGE_KEYS.tenantId, state.tenantId);
    },
    onSaved: afterSaved,
  });
}