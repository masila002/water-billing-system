export function setToast(message, error = false) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast is-visible ${error ? "toast-error" : ""}`;
  window.clearTimeout(setToast.timeout);
  setToast.timeout = window.setTimeout(
    () => toast.classList.remove("is-visible"),
    3600,
  );
}
