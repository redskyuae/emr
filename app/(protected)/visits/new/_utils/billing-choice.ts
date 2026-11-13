import type { CreateVisitFormValues } from './create-visit-form-schema';

export type BillingChoice = 'none' | 'later' | 'now';

type BillingFields = Pick<
  CreateVisitFormValues,
  'createInvoice' | 'paymentTiming' | 'chargeAmount' | 'amountReceived'
>;

/** The single Billing choice that a pair of form flags represents. */
export function billingChoiceOf(values: Pick<BillingFields, 'createInvoice' | 'paymentTiming'>) {
  if (!values.createInvoice) return 'none';
  return values.paymentTiming === 'NOW' ? 'now' : 'later';
}

/** Form values to write when staff pick a Billing choice. */
export function billingChoiceValues(choice: BillingChoice, chargeAmount: string) {
  return {
    createInvoice: choice !== 'none',
    paymentTiming: choice === 'now' ? ('NOW' as const) : ('LATER' as const),
    amountReceived: choice === 'now' ? chargeAmount : '0',
  };
}

function amount(value: string) {
  const parsed = Number(value);
  return value !== '' && Number.isFinite(parsed) ? parsed : null;
}

/** Charge, amount collected now and the Balance Due for the Check-in summary. */
export function billingTotals(values: BillingFields) {
  const choice = billingChoiceOf(values);
  if (choice === 'none') return { choice, charge: null, collected: null, balance: null };

  const charge = amount(values.chargeAmount);
  const collected = choice === 'now' ? (amount(values.amountReceived) ?? 0) : 0;
  const balance = charge === null ? null : Math.max(0, charge - collected);

  return { choice, charge, collected, balance };
}
