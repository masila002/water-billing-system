import {
  DEFAULT_API_BASE,
  DEMO_TENANT_ID,
  STORAGE_KEYS,
} from '../../../shared/constants.js';

export const state = {
  activeView: 'overview',
  apiBase: localStorage.getItem(STORAGE_KEYS.apiBase) || DEFAULT_API_BASE,
  tenantId: localStorage.getItem(STORAGE_KEYS.tenantId) || DEMO_TENANT_ID,
  connected: false,
  data: { summary: null, customers: [], accounts: [], bills: [], payments: [] },
};