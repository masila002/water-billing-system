import { field, openDialog } from '../components/dialog.js';
import { setToast } from '../components/toast.js';
import { formatMoney } from '../lib/format.js';
import { request } from '../lib/api.js';

export function openPaymentForm(state, afterSaved) {
  const outstanding = state.data.bills.filter((bill) => ['issued', 'partially_paid', 'overdue'].includes(bill.status));
  if (!outstanding.length) {
    setToast('No outstanding bills are available for payment.', true);
    return;
  }
  const options = outstanding.map((bill) => `<option value="${bill.id}" data-account="${bill.serviceAccountId}">${bill.billNumber} · ${bill.customerName} · ${formatMoney(bill.totalMinor)}</option>`).join('');
  openDialog({
    title: 'Record a payment',
    subtitle: 'Apply a payment to an issued customer bill.',
    content: `<div class="form-grid"><label class="form-field form-field-wide"><span>Bill <b>*</b></span><select name="billId" required>${options}</select></label>${field('Amount (KES)', 'amount', 'number', 'e.g. 2,500', true)}<label class="form-field"><span>Payment method <b>*</b></span><select name="method" required><option value="mpesa">M-Pesa</option><option value="cash">Cash</option><option value="bank">Bank</option><option value="other">Other</option></select></label>${field('Reference', 'externalReference', 'text', 'Optional transaction code')}</div>`,
    onSubmit: async (form) => {
      const billId = form.get('billId');
      const serviceAccountId = document.querySelector('[name="billId"]').selectedOptions[0].dataset.account;
      const amountMinor = Math.round(Number(form.get('amount')) * 100);
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) throw new Error('Enter a valid payment amount.');
      await request(state, '/payments', {
        method: 'POST',
        body: JSON.stringify({
          billId, serviceAccountId, amountMinor, method: form.get('method'),
          externalReference: form.get('externalReference') || undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
    },
    onSaved: afterSaved,
  });
}