import { icon } from "./icons.js";

export function field(
  label,
  name,
  type = "text",
  placeholder = "",
  required = false,
) {
  return `<label class="form-field"><span>${label}${required ? " <b>*</b>" : ""}</span><input name="${name}" type="${type}" placeholder="${placeholder}" ${required ? "required" : ""} /></label>`;
}

export function openDialog({
  title,
  subtitle,
  content,
  onSubmit,
  onSaved,
  submitLabel = "Save record",
}) {
  const root = document.querySelector("#dialog-root");
  const previousFocus = document.activeElement;
  const shell = document.querySelector(".app-shell");
  const close = () => {
    root.innerHTML = "";
    if (shell) shell.inert = false;
    if (previousFocus?.isConnected) previousFocus.focus();
  };
  if (shell) shell.inert = true;
  root.innerHTML = `<div class="dialog-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-heading"><div><p class="eyebrow">MAJIBILL OPERATIONS</p><h2 id="dialog-title">${title}</h2><p>${subtitle}</p></div><button class="dialog-close" type="button" aria-label="Close dialog">×</button></div><form id="dialog-form">${content}<div class="dialog-actions"><button type="button" class="button button-quiet" data-close>Cancel</button><button class="button button-primary" type="submit">${icon("plus")}<span>${submitLabel}</span></button></div><p class="form-error" aria-live="polite"></p></form></section></div>`;
  root.querySelector(".dialog-backdrop").addEventListener("click", (event) => {
    if (event.target.classList.contains("dialog-backdrop")) close();
  });
  root.querySelector(".dialog-close").addEventListener("click", () => {
    close();
  });
  root.querySelector("[data-close]").addEventListener("click", () => {
    close();
  });
  root
    .querySelector("#dialog-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = event.currentTarget.querySelector('[type="submit"]');
      const error = root.querySelector(".form-error");
      submit.disabled = true;
      error.textContent = "";
      try {
        await onSubmit(new FormData(event.currentTarget));
        close();
        await onSaved?.();
      } catch (failure) {
        error.textContent = failure.message;
        submit.disabled = false;
      }
    });
  root.querySelector(".dialog").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key === "Tab") {
      const focusable = [
        ...root.querySelectorAll(
          "button:not(:disabled), input, select, a[href]",
        ),
      ];
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  (
    root.querySelector("input, select") || root.querySelector(".dialog-close")
  )?.focus();
  return close;
}
