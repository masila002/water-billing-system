import { createDemoStore } from "./demo-store.js";
let demo;
function demoStore() {
  return (demo ||= createDemoStore({ storage: localStorage }));
}
export function resetDemo() {
  demoStore().reset();
}
export async function request(state, path, options = {}) {
  if (state.mode === "demo")
    return demoStore().request(path, options, {
      role: state.role,
      tenantId: state.tenantId,
    });
  const response = await fetch(`${state.apiBase.replace(/\/$/, "")}${path}`, {
    ...options,
    signal: AbortSignal.timeout(8000),
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": state.tenantId,
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join("; ")
        : body.message || `Request failed (${response.status})`,
    );
  return body;
}
export async function loadData(state) {
  const keys = [
    "summary",
    "customers",
    "accounts",
    "bills",
    "payments",
    ...(state.mode === "demo" ? ["readings", "tariffs", "audit"] : []),
  ];
  try {
    const values = await Promise.all(
      keys.map((key) =>
        request(state, key === "summary" ? "/dashboard" : `/${key}`),
      ),
    );
    state.data = {
      readings: [],
      tariffs: [],
      audit: [],
      ...Object.fromEntries(keys.map((key, i) => [key, values[i]])),
    };
    state.connected = true;
    state.error = null;
  } catch (error) {
    state.connected = false;
    state.error = error.message;
    state.data = {
      summary: null,
      customers: [],
      accounts: [],
      bills: [],
      payments: [],
      readings: [],
      tariffs: [],
      audit: [],
    };
  }
  return state.error;
}
