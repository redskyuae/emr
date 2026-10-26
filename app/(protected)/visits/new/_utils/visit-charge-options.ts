import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { VisitPatientType } from '@/app/api/lib/modules/visit/schemas/visit-patient-type';

export const VISIT_CHARGE_OPTIONS = [
  { value: 'NEW_CONSULTATION', label: 'New Patient Consultation' },
  { value: 'ESTABLISHED_CONSULTATION', label: 'Established Patient Consultation' },
  { value: 'FOLLOW_UP_CONSULTATION', label: 'Follow-up Consultation' },
  { value: 'TREATMENT_SESSION', label: 'Treatment Session' },
] as const;

export type VisitChargeKind = (typeof VISIT_CHARGE_OPTIONS)[number]['value'];

const CHARGE_ITEM_CODES: Record<VisitChargeKind, readonly string[]> = {
  NEW_CONSULTATION: ['CONS_NEW', 'NEW_CONS', 'NEW_CONSULTATION', 'NEW_OPD'],
  ESTABLISHED_CONSULTATION: ['CONS_EST', 'EST_CONS', 'ESTABLISHED_CONSULTATION', 'EST_OPD'],
  FOLLOW_UP_CONSULTATION: ['CONS_FUP', 'FUP', 'FOLLOW_UP', 'FOLLOWUP'],
  TREATMENT_SESSION: ['TREAT_SESSION', 'TREATMENT_SESSION', 'PROC_SESSION'],
};

function matchesKind(item: ChargeItem, kind: VisitChargeKind) {
  const name = item.name.trim().toLowerCase();
  if (kind === 'TREATMENT_SESSION') {
    return (
      item.category === 'PROCEDURE' &&
      (/\b(treatment|therapy|procedure)\b.*\bsession\b/.test(name) ||
        /\bsession\b.*\b(treatment|therapy|procedure)\b/.test(name))
    );
  }
  if (item.category !== 'CONSULTATION') return false;
  if (kind === 'NEW_CONSULTATION') {
    return /\b(new|initial|first)\b.*\b(consultation|opd)\b/.test(name);
  }
  if (kind === 'ESTABLISHED_CONSULTATION') {
    return /\b(established|returning|repeat)\b.*\b(consultation|opd)\b/.test(name);
  }
  return /\bfollow[ -]?up\b/.test(name);
}

export function findVisitChargeItem(items: ChargeItem[], kind: VisitChargeKind) {
  const category = kind === 'TREATMENT_SESSION' ? 'PROCEDURE' : 'CONSULTATION';
  const available = items.filter((item) => item.isActive && item.category === category);
  return (
    available.find((item) => CHARGE_ITEM_CODES[kind].includes(item.code.trim().toUpperCase())) ??
    available.find((item) => matchesKind(item, kind)) ??
    null
  );
}

export function suggestedVisitChargeKind(
  visitTypeCode: string | null,
  patientType: VisitPatientType | null
): VisitChargeKind | null {
  switch (visitTypeCode?.toUpperCase()) {
    case 'FUP':
      return 'FOLLOW_UP_CONSULTATION';
    case 'PROC':
      return 'TREATMENT_SESSION';
    case 'OPD':
      return patientType === 'NEW'
        ? 'NEW_CONSULTATION'
        : patientType === 'ESTABLISHED'
          ? 'ESTABLISHED_CONSULTATION'
          : null;
    default:
      return null;
  }
}
