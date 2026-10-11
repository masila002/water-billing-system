import { ROLES } from "../app/state.js";
export function renderSession(onEnter) {
  document.querySelector("#app").innerHTML =
    `<main class="welcome"><section class="welcome-story"><a class="powered" href="https://404-hub-spot.vercel.app/" target="_blank" rel="noopener noreferrer">404HubSpot / UTILITY SOFTWARE</a><p class="eyebrow">MEET MAJIBILL</p><h1>Every drop.<br>Every bill.<br>One clear picture.</h1><p>From the first meter reading to the final receipt. Water billing built around the people who keep your community flowing.</p><div class="welcome-flow">01 Register <span>→</span> 02 Read <span>→</span> 03 Bill <span>→</span> 04 Collect</div><small>Prepared for utility teams and the ZUCAR partnership discussion.</small></section><section class="welcome-card"><span class="demo-pill">INTERACTIVE DEMO</span><h2>Your utility workspace</h2><p>Explore Nakuru Demo Water with fictional customers and working billing workflows.</p><form id="session-form"><label class="form-field"><span>Explore as</span><select name="role">${Object.entries(
      ROLES,
    )
      .map(([id, label]) => `<option value="${id}">${label}</option>`)
      .join(
        "",
      )}</select></label><button class="button button-primary" type="submit">Enter demo workspace <span>→</span></button></form><p class="demo-disclosure">No password needed. Roles illustrate staff responsibilities; this is not secure sign-in. Payments are simulated and data stays in this browser.</p><a class="powered" href="https://404-hub-spot.vercel.app/" target="_blank" rel="noopener noreferrer">Powered by <strong>404HubSpot ↗</strong></a></section></main>`;
  document.querySelector("#session-form").addEventListener("submit", (e) => {
    e.preventDefault();
    onEnter(new FormData(e.currentTarget).get("role"));
  });
}
