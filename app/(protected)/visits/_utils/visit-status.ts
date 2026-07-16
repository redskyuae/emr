import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';

type VisitStatusPresentation = {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
};

const VISIT_STATUS_PRESENTATION: Record<VisitStatus, VisitStatusPresentation> = {
  CHECKED_IN: { label: 'Checked In', variant: 'secondary' },
  IN_CONSULTATION: { label: 'In Consultation', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const VISIT_STATUS_FILTERS = [
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'IN_CONSULTATION', label: 'In Consultation' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export function visitStatusPresentation(status: VisitStatus) {
  return VISIT_STATUS_PRESENTATION[status];
}

export function isActiveVisit(status: VisitStatus) {
  return status === 'CHECKED_IN' || status === 'IN_CONSULTATION';
}

/** The board and the API speak DD-MM-YYYY; `<input type="date">` speaks ISO. */
export function toDateInputValue(displayDate: string) {
  const [day, month, year] = displayDate.split('-');
  return `${year}-${month}-${day}`;
}

export function toDisplayDate(inputValue: string) {
  const [year, month, day] = inputValue.split('-');
  return `${day}-${month}-${year}`;
}

export function todayDisplayDate(timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.day}-${values.month}-${values.year}`;
}
