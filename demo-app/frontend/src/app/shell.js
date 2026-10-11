import { NAV_ITEMS } from "../../../shared/constants.js";
import { icon } from "../components/icons.js";
import { escapeHtml } from "../lib/format.js";
import { ROLES } from "./state.js";
export function renderShell(state, { onNavigate, onSettings, onRole }) {
  const nav = NAV_ITEMS.filter(
    (item) =>
      state.mode === "demo" ||
      !["readings", "reports", "audit"].includes(item.id),
  );
  document.querySelector("#app").innerHTML =
    `<div class="app-shell"><aside class="sidebar">
    <a class="brand" href="#overview" aria-label="MajiBill overview"><span class="brand-mark"><span></span><span></span><span></span></span><span class="brand-name">maji<span>bill</span><small>UTILITY OPERATIONS</small></span></a>
    <div class="utility-switch"><span class="utility-avatar">N</span><span><strong>Nakuru Demo Water</strong><small>Fictional demonstration utility</small></span></div><p class="nav-label">WORKSPACE</p>
    <nav class="primary-nav" aria-label="Main navigation">${nav.map(({ id, label }) => `<button class="nav-link ${id === state.activeView ? "active" : ""}" data-view="${id}" aria-label="${label}" ${id === state.activeView ? 'aria-current="page"' : ""}>${icon(id)}<span>${label}</span>${id === "bills" && state.data.summary?.unpaid_bills ? `<span class="nav-count">${escapeHtml(state.data.summary.unpaid_bills)}</span>` : ""}</button>`).join("")}</nav>
    <div class="sidebar-foot"><a class="powered" href="https://404-hub-spot.vercel.app/" target="_blank" rel="noopener noreferrer">Powered by <strong>404HubSpot ↗</strong></a><div class="profile"><span class="profile-avatar">${escapeHtml(state.role.slice(0, 2).toUpperCase())}</span><span><strong>${escapeHtml(ROLES[state.role])}</strong><small>Demo persona</small></span></div></div></aside>
    <div class="workspace"><header class="topbar"><div class="breadcrumb"><span>Workspace</span>${icon("arrow")}<strong>${nav.find((item) => item.id === state.activeView)?.label || "Overview"}</strong></div><div class="top-actions"><span class="connection"><i class="${state.connected ? "" : "offline"}"></i><span>${state.mode === "demo" ? "Local demo" : state.connected ? "Local API connected" : "API unavailable"}</span></span><label class="role-control"><span class="sr-only">Demo role</span><select id="role-select">${Object.entries(
      ROLES,
    )
      .map(
        ([id, label]) =>
          `<option value="${id}" ${id === state.role ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select></label><button class="icon-button" id="settings-button" aria-label="Demo settings">${icon("settings")}</button></div></header>
    <div class="demo-banner"><span><strong>${state.mode === "demo" ? "Demo workspace" : "Local API integration"}</strong> · Fictional data · ${state.mode === "demo" ? "Payments are simulated" : "No authenticated access control"}</span><button class="text-button" id="exit-demo">Exit workspace</button></div>
    <main id="view" class="content"></main></div></div><div id="dialog-root"></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.addEventListener("click", () => onNavigate(button.dataset.view)),
    );
  document.querySelector(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    onNavigate("overview");
  });
  document
    .querySelector("#settings-button")
    .addEventListener("click", onSettings);
  document
    .querySelector("#role-select")
    .addEventListener("change", (e) => onRole(e.target.value));
  document
    .querySelector("#exit-demo")
    .addEventListener("click", () => onRole(""));
}
