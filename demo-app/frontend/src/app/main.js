import { DEMO_TENANT_ID } from "../../../shared/constants.js";
import "../styles/main.css";
import { setToast } from "../components/toast.js";
import { renderDashboard } from "../features/dashboard.js";
import { openCustomerForm } from "../features/customer-form.js";
import { openPaymentForm } from "../features/payment-form.js";
import {
  openAccountForm,
  openReadingForm,
  openBillForm,
} from "../features/workflow-forms.js";
import { renderRecords, filterRecords } from "../features/records.js";
import { renderReports, downloadCSV } from "../features/reports.js";
import { openDocument } from "../features/documents.js";
import { openSettingsForm } from "../features/settings-form.js";
import { renderSession } from "../features/session.js";
import { loadData } from "../lib/api.js";
import { state, can, ROLES } from "./state.js";
import { renderShell } from "./shell.js";
const forms = {
  "add-customer": openCustomerForm,
  "add-account": openAccountForm,
  "add-reading": openReadingForm,
  "generate-bill": openBillForm,
  "record-payment": openPaymentForm,
};
let generation = 0;
function setRole(role) {
  if (role && !state.role) {
    state.mode = "demo";
    state.tenantId = DEMO_TENANT_ID;
    state.activeView = "overview";
    try {
      localStorage.setItem("majibill-mode", "demo");
    } catch {
      /* Ledger access reports storage failures. */
    }
  }
  state.role = role;
  try {
    sessionStorage.setItem("majibill-role", role);
  } catch {
    /* Continue in memory when session storage is disabled. */
  }
  if (role) refreshData();
  else {
    generation++;
    render();
  }
}
function render() {
  if (!ROLES[state.role]) return renderSession(setRole);
  renderShell(state, {
    onNavigate: (view) => {
      state.activeView = view;
      render();
    },
    onSettings: () => openSettingsForm(state, refreshData),
    onRole: setRole,
  });
  const view = document.querySelector("#view");
  view.innerHTML =
    state.activeView === "overview"
      ? renderDashboard(state)
      : state.activeView === "reports"
        ? renderReports(state)
        : renderRecords(state, state.activeView);
  view.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      state.activeView = nav.dataset.view;
      render();
      return;
    }
    const print = event.target.closest("[data-print]");
    if (print) {
      openDocument(state, print.dataset.print, print.dataset.id);
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    try {
      if (action === "refresh") await refreshData();
      else if (action === "settings") openSettingsForm(state, refreshData);
      else if (action === "export") downloadCSV(state);
      else if (forms[action]) {
        if (!can(state, action))
          throw new Error("This demo role cannot perform that action.");
        forms[action](state, async () => {
          await refreshData();
          setToast("Saved. Your workspace is up to date.");
        });
      }
    } catch (error) {
      setToast(error.message, true);
    }
  });
  view.querySelector("[data-search]")?.addEventListener("input", (e) => {
    view.querySelector("[data-table]").innerHTML = filterRecords(
      e.target.dataset.search,
      e.target.value,
      state,
    );
  });
}
async function refreshData() {
  const current = ++generation;
  const snapshot = { ...state };
  const failure = await loadData(snapshot);
  if (current !== generation) return;
  state.data = snapshot.data;
  state.connected = snapshot.connected;
  state.error = snapshot.error;
  render();
  if (failure) setToast(failure, true);
}
render();
if (ROLES[state.role]) refreshData();
