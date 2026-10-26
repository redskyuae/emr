import type { VisitChargeKind } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';

export const VISIT_CHARGE_OPTIONS: ReadonlyArray<{ value: VisitChargeKind; label: string }> = [
  { value: 'NEW_CONSULTATION', label: 'New Patient Consultation' },
  { value: 'ESTABLISHED_CONSULTATION', label: 'Established Patient Consultation' },
  { value: 'FOLLOW_UP_CONSULTATION', label: 'Follow-up Consultation' },
  { value: 'TREATMENT_SESSION', label: 'Treatment Session' },
];
