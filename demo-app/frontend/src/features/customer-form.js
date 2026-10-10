import { field, openDialog } from '../components/dialog.js';
import { request } from '../lib/api.js';

export function openCustomerForm(state, afterSaved) {
  const suggestedNumber = `CUS-${String(state.data.customers.length + 1).padStart(4, '0')}`;
  openDialog({
    title: 'Add a customer',
    subtitle: 'Create a customer record for this utility.',
    content: `<div class="form-grid">${field('Customer number', 'customerNumber', 'text', suggestedNumber, true)}${field('Full name', 'fullName', 'text', 'Customer name', true)}${field('Phone number', 'phone', 'tel', '+254 7xx xxx xxx')}${field('Email address', 'email', 'email', 'name@example.com')}${field('Location', 'address', 'text', 'Town or area')}</div>`,
    onSubmit: async (form) => {
      const customer = Object.fromEntries(form.entries());
      Object.keys(customer).forEach((key) => {
        if (customer[key] === '') delete customer[key];
      });
      await request(state, '/customers', { method: 'POST', body: JSON.stringify(customer) });
    },
    onSaved: afterSaved,
  });
  document.querySelector('[name="customerNumber"]').value = suggestedNumber;
}