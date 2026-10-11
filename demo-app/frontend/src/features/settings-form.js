import { openDialog } from "../components/dialog.js";
import { STORAGE_KEYS, DEMO_TENANT_ID } from "../../../shared/constants.js";
import { escapeHtml } from "../lib/format.js";
import { resetDemo } from "../lib/api.js";
export function openSettingsForm(state, afterSaved) {
  const close = openDialog({
    title: "Workspace settings",
    subtitle:
      "The local demo works without a server. API mode uses the existing local integration.",
    submitLabel: "Apply settings",
    content: `<div class="form-grid"><label class="form-field form-field-wide"><span>Data source</span><select name="mode"><option value="demo" ${state.mode === "demo" ? "selected" : ""}>Local demo (recommended for pitches)</option><option value="api" ${state.mode === "api" ? "selected" : ""}>Local API integration</option></select></label><label class="form-field form-field-wide"><span>API base URL</span><input name="apiBase" type="url" value="${escapeHtml(state.apiBase)}" required /></label><label class="form-field form-field-wide"><span>API tenant ID</span><input name="tenantId" value="${escapeHtml(state.tenantId)}" required /></label></div><p class="demo-disclosure">Local demo roles are illustrative. The existing API has no authenticated access control and is for local fictional data only.</p><button class="button button-quiet" type="button" id="reset-demo">Reset fictional demo data</button><p id="reset-result" role="status"></p>`,
    onSubmit: (form) => {
      const mode = String(form.get("mode"));
      const apiBase = String(form.get("apiBase")).replace(/\/$/, "");
      const url = new URL(apiBase);
      if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Use an HTTP or HTTPS API URL.");
      localStorage.setItem("majibill-mode", mode);
      localStorage.setItem(STORAGE_KEYS.apiBase, apiBase);
      localStorage.setItem(
        STORAGE_KEYS.tenantId,
        String(form.get("tenantId")).trim(),
      );
      state.mode = mode;
      state.apiBase = apiBase;
      state.tenantId =
        mode === "demo" ? DEMO_TENANT_ID : String(form.get("tenantId")).trim();
      state.activeView = "overview";
    },
    onSaved: afterSaved,
  });
  document.querySelector("#reset-demo").addEventListener("click", async () => {
    if (
      !window.confirm(
        "Reset all fictional demo records in this browser? Your demo changes will be replaced with the sample data.",
      )
    )
      return;
    try {
      resetDemo();
      close();
      await afterSaved();
    } catch (error) {
      document.querySelector("#reset-result").textContent = error.message;
    }
  });
}
