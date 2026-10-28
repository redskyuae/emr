import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { VisitPatientType } from '@/app/api/lib/modules/visit/schemas/visit-patient-type';
import { VISIT_CHARGE_OPTIONS } from '@/lib/visit-charge-options';

export { VISIT_CHARGE_OPTIONS };

export type VisitChargeKind = (typeof VISIT_CHARGE_OPTIONS)[number]['value'];

export function visitChargePrice(item: ChargeItem) {
  return item.cashPrice ?? item.unitPrice;
}

export function isFreeFollowUpCharge(
  item: ChargeItem,
  visitTypeCode: string | null,
  hasRecentDoctorVisit: boolean
) {
  return (
    visitTypeCode?.toUpperCase() === 'FUP' && hasRecentDoctorVisit && item.freeFollowUpEligible
  );
}

export function listVisitChargeItems(
  items: ChargeItem[],
  kind: VisitChargeKind,
  visitDate?: string | null
) {
  const category = kind === 'TREATMENT_SESSION' ? 'PROCEDURE' : 'CONSULTATION';
  const available = items.filter(
    (item) =>
      item.isActive &&
      item.category === category &&
      (!visitDate || !item.effectiveDate || item.effectiveDate <= visitDate)
  );
  const explicit = available.filter((item) => item.visitChargeKind === kind);
  const legacy = available.filter(
    (item) =>
      !item.visitChargeKind &&
      (CHARGE_ITEM_CODES[kind].includes(item.code.trim().toUpperCase()) || matchesKind(item, kind))
  );
  return [...explicit, ...legacy];
}

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

export function findVisitChargeItem(
  items: ChargeItem[],
  kind: VisitChargeKind,
  visitDate?: string | null
) {
  return listVisitChargeItems(items, kind, visitDate)[0] ?? null;
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
