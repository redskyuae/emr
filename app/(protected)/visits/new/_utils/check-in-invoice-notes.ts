import type { CreateVisitFormValues } from './create-visit-form-schema';

type ReimbursementDetails = Pick<
  CreateVisitFormValues,
  'paymentClassification' | 'insurer' | 'policyReference'
>;

export function checkInInvoiceNotes(details: ReimbursementDetails) {
  if (details.paymentClassification === 'SELF_PAY') return undefined;

  return [
    'Insurance reimbursement documentation — Patient pays upfront; no claim is processed.',
    details.insurer ? `Insurer: ${details.insurer}` : null,
    details.policyReference ? `Policy / Member Reference: ${details.policyReference}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
