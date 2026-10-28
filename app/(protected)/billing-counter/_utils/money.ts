export const CURRENCY = 'AED';

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// A fixed locale keeps server and client markup identical during hydration.
export function formatAed(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Splits a VAT-inclusive amount into its net and VAT parts. */
export function splitVatInclusive(amount: number, vatRate: number) {
  const net = round2(amount / (1 + vatRate / 100));

  return { net, vat: round2(amount - net) };
}
