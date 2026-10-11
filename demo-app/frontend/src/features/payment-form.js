import { field, openDialog } from "../components/dialog.js";
import { setToast } from "../components/toast.js";
import { escapeHtml as esc, formatMoney } from "../lib/format.js";
import { request } from "../lib/api.js";
export function openPaymentForm(state, afterSaved) {
  const outstanding = state.data.bills.filter((b) =>
    ["issued", "partially_paid", "overdue"].includes(b.status),
  );
  if (!outstanding.length)
    return setToast("No outstanding bills. Issue a bill first.", true);
  const key = crypto.randomUUID();
  const options = outstanding
    .map(
      (b) =>
        `<option value="${esc(b.id)}">${esc(b.billNumber)} · ${esc(b.customerName)} · ${formatMoney(b.balanceMinor ?? b.totalMinor)} remaining</option>`,
    )
    .join("");
  openDialog({
    title:
      state.mode === "demo" ? "Record a simulated payment" : "Record a payment",
    subtitle:
      state.mode === "demo"
        ? "No money is collected and no M-Pesa prompt is sent."
        : "Apply a payment to an issued customer bill.",
    submitLabel: "Record payment",
    content: `<div class="form-grid"><label class="form-field form-field-wide"><span>Bill <b>*</b></span><select name="billId" required>${options}</select></label>${field("Amount (KES)", "amount", "number", "", true)}<label class="form-field"><span>Payment method <b>*</b></span><select name="method" required><option value="mpesa">M-Pesa${state.mode === "demo" ? " (simulated)" : ""}</option><option value="cash">Cash</option><option value="bank">Bank</option><option value="other">Other</option></select></label>${field("Reference", "externalReference", "text", "Unique transaction code (optional)")}</div>`,
    onSubmit: async (form) => {
      const bill = outstanding.find((b) => b.id === form.get("billId"));
      const raw = String(form.get("amount"));
      if (!/^\d+(\.\d{1,2})?$/.test(raw))
        throw new Error(
          "Use a positive amount with at most two decimal places.",
        );
      const amountMinor = Math.round(Number(raw) * 100);
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 1)
        throw new Error("Enter a valid payment amount.");
      await request(state, "/payments", {
        method: "POST",
        body: JSON.stringify({
          billId: bill.id,
          serviceAccountId: bill.serviceAccountId,
          amountMinor,
          method: form.get("method"),
          externalReference: form.get("externalReference") || undefined,
          idempotencyKey: key,
        }),
      });
    },
    onSaved: afterSaved,
  });
  const amount = document.querySelector('[name="amount"]');
  amount.min = "0.01";
  amount.step = "0.01";
  const update = () => {
    const b = outstanding.find(
      (b) => b.id === document.querySelector('[name="billId"]').value,
    );
    amount.value = ((b.balanceMinor ?? b.totalMinor) / 100).toFixed(2);
    amount.max = amount.value;
  };
  document.querySelector('[name="billId"]').addEventListener("change", update);
  update();
}
