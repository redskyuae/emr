import { format, subDays } from 'date-fns';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type {
  VisitListBillingStatus,
  VisitListPatientType,
  VisitListRow,
} from '../_data/static-visit-list';

export type VisitListSource = 'appointment' | 'walk-in';

export type VisitListFilters = {
  to: string | null;
  from: string | null;
  query: string;
  type: string | null;
  doctor: string | null;
  status: VisitStatus | null;
  source: VisitListSource | null;
  billing: VisitListBillingStatus | null;
  patientType: VisitListPatientType | null;
};

export const DATE_PRESETS = [
  { value: 'today', label: 'Today', daysBack: 0 },
  { value: 'yesterday', label: 'Yesterday', daysBack: 1 },
  { value: 'week', label: 'Last 7 days', daysBack: 6 },
  { value: 'fortnight', label: 'Last 14 days', daysBack: 13 },
] as const;

export const SOURCE_OPTIONS = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'walk-in', label: 'Walk-in' },
] as const;

export const PATIENT_TYPE_OPTIONS = [
  { value: 'New', label: 'New Patient' },
  { value: 'Established', label: 'Established Patient' },
] as const;

export const BILLING_OPTIONS = [
  { value: 'NOT_BILLED', label: 'Not billed' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
] as const;

export function toIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function visitDateOf(row: VisitListRow, today: Date) {
  return toIsoDate(subDays(today, row.dayOffset));
}

export function datePresetRange(daysBack: number, today: Date) {
  return { from: toIsoDate(subDays(today, daysBack)), to: toIsoDate(today) };
}

function matchesQuery(row: VisitListRow, query: string) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return [
    row.visitNumber,
    row.patient.name,
    row.patient.mrn,
    row.patient.phone,
    row.bookingNumber ?? 'walk-in',
    row.billing.invoiceNumber ?? '',
    `token ${row.queueToken}`,
  ].some((value) => value.toLowerCase().includes(needle));
}

export function filterVisits(rows: VisitListRow[], filters: VisitListFilters, today: Date) {
  return rows
    .filter((row) => {
      const date = visitDateOf(row, today);

      return (
        (!filters.from || date >= filters.from) &&
        (!filters.to || date <= filters.to) &&
        (!filters.doctor || row.doctor.id === filters.doctor) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.type || row.visitType.code === filters.type) &&
        (!filters.patientType || row.patientType === filters.patientType) &&
        (!filters.billing || row.billing.status === filters.billing) &&
        (!filters.source || (filters.source === 'appointment') === (row.bookingNumber !== null)) &&
        matchesQuery(row, filters.query)
      );
    })
    .sort((a, b) => a.dayOffset - b.dayOffset || b.checkedInAt.localeCompare(a.checkedInAt));
}

export function summarizeVisits(rows: VisitListRow[]) {
  const byStatus: Record<VisitStatus, number> = {
    CHECKED_IN: 0,
    IN_CONSULTATION: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  let balanceDue = 0;
  let unbilledCompleted = 0;

  for (const row of rows) {
    byStatus[row.status] += 1;
    balanceDue += row.billing.balanceDue;

    if (row.status === 'COMPLETED' && row.billing.status === 'NOT_BILLED') {
      unbilledCompleted += 1;
    }
  }

  return { total: rows.length, byStatus, balanceDue, unbilledCompleted };
}

export function countActiveFilters(filters: VisitListFilters) {
  const { from, to, query, ...rest } = filters;
  const dropdowns = Object.values(rest).filter((value) => value !== null).length;

  return dropdowns + (query.trim() ? 1 : 0) + (from || to ? 1 : 0);
}
