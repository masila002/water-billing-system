export async function request(state, path, options = {}) {
  const response = await fetch(`${state.apiBase.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': state.tenantId,
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

export async function loadData(state) {
  const results = await Promise.allSettled([
    request(state, '/dashboard'), request(state, '/customers'), request(state, '/accounts'),
    request(state, '/bills'), request(state, '/payments'),
  ]);
  const [summary, customers, accounts, bills, payments] = results;
  state.connected = summary.status === 'fulfilled';
  if (summary.status === 'fulfilled') state.data.summary = summary.value;
  if (customers.status === 'fulfilled') state.data.customers = customers.value;
  if (accounts.status === 'fulfilled') state.data.accounts = accounts.value;
  if (bills.status === 'fulfilled') state.data.bills = bills.value;
  if (payments.status === 'fulfilled') state.data.payments = payments.value;
  return results.every((result) => result.status === 'rejected')
    ? summary.reason?.message || 'Could not reach the API.'
    : null;
}