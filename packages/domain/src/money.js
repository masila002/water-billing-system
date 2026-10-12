export function addMoney(a, b) {
  if (a.currency !== b.currency) throw new Error('currency mismatch');
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function calculateBill(input) {
  if (!Number.isInteger(input.consumedMilliUnits) || input.consumedMilliUnits < 0) {
    throw new Error('consumedMilliUnits must be a non-negative integer');
  }
  const variable =
    (BigInt(input.consumedMilliUnits) * input.tariff.ratePerUnitMinor + 500n) / 1000n;
  const total = variable + input.tariff.fixedChargeMinor;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('bill exceeds limits');
  return { variableChargeMinor: variable, fixedChargeMinor: input.tariff.fixedChargeMinor, totalMinor: total };
}

export function allocateFifo(dueBills, paymentMinor) {
  if (paymentMinor <= 0n) throw new Error('payment must be positive');
  const out = [];
  let rest = paymentMinor;
  for (const b of dueBills) {
    if (rest <= 0n) break;
    if (b.balanceMinor <= 0n) continue;
    const take = rest < b.balanceMinor ? rest : b.balanceMinor;
    out.push({ billId: b.id, amountMinor: take });
    rest -= take;
  }
  if (rest > 0n) throw new Error('payment exceeds total due');
  return out;
}
