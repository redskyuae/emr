import type { ChargeItemCategory, VisitChargeKind } from './schemas/charge-item-schema';

export type VisitChargeItemSeed = {
  code: string;
  name: string;
  category: ChargeItemCategory;
  unitPrice: number;
  visitChargeKind: VisitChargeKind;
  freeFollowUpEligible: boolean;
};

// Starter AED patient-pay rates. Hospitals can edit these in Billing Masters.
export const DEFAULT_VISIT_CHARGE_ITEMS: readonly VisitChargeItemSeed[] = [
  {
    code: 'CONS_NEW',
    name: 'New Consultation',
    category: 'CONSULTATION',
    unitPrice: 200,
    visitChargeKind: 'NEW_CONSULTATION',
    freeFollowUpEligible: false,
  },
  {
    code: 'CONS_EST',
    name: 'Established Consultation',
    category: 'CONSULTATION',
    unitPrice: 150,
    visitChargeKind: 'ESTABLISHED_CONSULTATION',
    freeFollowUpEligible: false,
  },
  {
    code: 'CONS_FUP',
    name: 'Follow-up Consultation',
    category: 'CONSULTATION',
    unitPrice: 150,
    visitChargeKind: 'FOLLOW_UP_CONSULTATION',
    freeFollowUpEligible: true,
  },
  {
    code: 'TREAT_SESSION',
    name: 'Treatment Session',
    category: 'PROCEDURE',
    unitPrice: 250,
    visitChargeKind: 'TREATMENT_SESSION',
    freeFollowUpEligible: false,
  },
];
