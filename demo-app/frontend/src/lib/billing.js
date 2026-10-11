/** Half-up rounding from thousandths of a cubic metre into integer KES cents. */
export function calculateBillMinor(
  previousReading,
  currentReading,
  ratePerUnitMinor,
  fixedChargeMinor,
) {
  const milliUnits =
    Math.round(currentReading * 1000) - Math.round(previousReading * 1000);
  const total =
    (BigInt(milliUnits) * BigInt(ratePerUnitMinor) + 500n) / 1000n +
    BigInt(fixedChargeMinor);
  if (total < 0n || total > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Bill amount exceeds supported limits.");
  return Number(total);
}
