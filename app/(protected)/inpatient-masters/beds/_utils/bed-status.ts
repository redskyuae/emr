import type { BedStatus } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { MANUAL_BED_STATUSES } from '@/app/api/lib/modules/bed/schemas/bed-schema';

type BedStatusPresentation = {
  label: string;
  className: string;
};

const BED_STATUS_PRESENTATION: Record<BedStatus, BedStatusPresentation> = {
  AVAILABLE: {
    label: 'Available',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  OCCUPIED: {
    label: 'Occupied',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  },
  RESERVED: {
    label: 'Reserved',
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
};

// OCCUPIED is system-managed (ADR 0033), so the form only ever offers the rest.
export const MANUAL_BED_STATUS_OPTIONS = MANUAL_BED_STATUSES.map((status) => ({
  value: status,
  label: BED_STATUS_PRESENTATION[status].label,
}));

export function getBedStatusLabel(status: BedStatus) {
  return BED_STATUS_PRESENTATION[status].label;
}

export function getBedStatusClassName(status: BedStatus) {
  return BED_STATUS_PRESENTATION[status].className;
}
