import {
  DEFAULT_API_BASE,
  DEMO_TENANT_ID,
  STORAGE_KEYS,
} from "../../../shared/constants.js";
export const ROLES = {
  admin: "Administrator",
  reader: "Meter reader",
  cashier: "Cashier",
  accountant: "Accountant",
};
export const permissions = {
  "add-customer": ["admin"],
  "add-account": ["admin"],
  "add-reading": ["admin", "reader"],
  "generate-bill": ["admin", "accountant"],
  "record-payment": ["admin", "cashier"],
};
export function can(state, action) {
  return state.mode === "api" || permissions[action]?.includes(state.role);
}
function readPreference(storageName, key) {
  try {
    return window[storageName].getItem(key);
  } catch {
    return null;
  }
}
export const state = {
  activeView: "overview",
  mode:
    readPreference("localStorage", "majibill-mode") === "api" ? "api" : "demo",
  role: readPreference("sessionStorage", "majibill-role") || "",
  apiBase:
    readPreference("localStorage", STORAGE_KEYS.apiBase) || DEFAULT_API_BASE,
  tenantId:
    readPreference("localStorage", STORAGE_KEYS.tenantId) || DEMO_TENANT_ID,
  connected: false,
  error: null,
  data: {
    summary: null,
    customers: [],
    accounts: [],
    bills: [],
    payments: [],
    readings: [],
    tariffs: [],
    audit: [],
  },
};
if (state.mode === "demo") state.tenantId = DEMO_TENANT_ID;
