import { format, isValid, parse, parseISO } from 'date-fns';

import { tenantLocalDateTime } from '@/app/api/lib/modules/appointment/schemas/appointment-slot';
import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { VisitsParams } from '@/app/queries/visits/useVisits';
import { VISIT_STATUS_FILTERS, toDisplayDate } from '../../visits/_utils/visit-status';

/** Filters as they appear in the URL: ISO dates for `<input type="date">`, ids as strings. */
// Previous Visits page size; the loading skeleton shows the same number of rows.
export const PREVIOUS_VISITS_PAGE_SIZE = 10;

export type PreviousVisitsUrlParams = {
  q: string | null;
  to: string | null;
  from: string | null;
  type: string | null;
  doctor: string | null;
  status: string | null;
};

export type PreviousVisitsFilters = {
  to: string;
  query: string;
  from: string | null;
  doctorId: string | null;
  visitTypeId: string | null;
  status: VisitStatus | null;
};

type DateRange = Pick<PreviousVisitsFilters, 'from' | 'to'>;

function toIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function isIsoDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

function isPositiveId(value: string | null): value is string {
  return value !== null && /^[1-9]\d*$/.test(value);
}

/**
 * "Today" is the Tenant's operational day (ADR 0026), not the browser's, so a
 * laptop in another time zone still sees the Visits checked in today. Until the
 * Tenant time zone is known it falls back to the browser's date.
 */
export function tenantToday(now: Date, timeZone: string | undefined): Date {
  return timeZone ? parseISO(tenantLocalDateTime(now, timeZone).date) : now;
}

/**
 * A fresh page lists every Visit up to today. With no start it reaches back to
 * the first Visit, including those imported from the source system.
 */
export function defaultRange(today: Date): DateRange {
  return { from: null, to: toIsoDate(today) };
}

/**
 * Turns whatever is in the URL into a filter set the API accepts. A missing or
 * malformed date drops that bound, and an inverted range falls back to the
 * default, so a hand-edited link still lists something sensible.
 */
export function resolveFilters(
  params: PreviousVisitsUrlParams,
  today: Date
): PreviousVisitsFilters {
  const fallback = defaultRange(today);
  const from = isIsoDate(params.from) ? params.from : null;
  const to = isIsoDate(params.to) ? params.to : fallback.to;
  const range = from === null || from <= to ? { from, to } : fallback;
  const status = VISIT_STATUS_FILTERS.find((option) => option.value === params.status)?.value;

  return {
    ...range,
    query: params.q?.trim() ?? '',
    status: status ?? null,
    doctorId: isPositiveId(params.doctor) ? params.doctor : null,
    visitTypeId: isPositiveId(params.type) ? params.type : null,
  };
}

/** Row-1 filters (date range and search) that differ from a fresh page. */
function countRowOneFilters(filters: PreviousVisitsFilters, today: Date) {
  const fallback = defaultRange(today);
  const rangeChanged = filters.from !== fallback.from || filters.to !== fallback.to;

  return [rangeChanged, filters.query !== ''].filter(Boolean).length;
}

/** Applied advanced filters (Doctor, Status, Visit Type), for the Advanced filters toggle. */
export function countAdvancedFilters(filters: PreviousVisitsFilters) {
  return [filters.status, filters.doctorId, filters.visitTypeId].filter((value) => value !== null)
    .length;
}

/** How many filters differ from a fresh page, for the Reset button badge. */
export function countActiveFilters(filters: PreviousVisitsFilters, today: Date) {
  return countRowOneFilters(filters, today) + countAdvancedFilters(filters);
}

/**
 * The names of the filters an Apply changed to a chosen value, for `list_filtered`. The search
 * term is not a filter (it is counted as a search), and clearing a filter is not applying one.
 */
export function appliedFilterNames(
  applied: PreviousVisitsFilters,
  next: PreviousVisitsFilters
): ('date_range' | 'status' | 'doctor' | 'type')[] {
  const names: ('date_range' | 'status' | 'doctor' | 'type')[] = [];

  if (next.from !== applied.from || next.to !== applied.to) names.push('date_range');
  if (next.status !== null && next.status !== applied.status) names.push('status');
  if (next.doctorId !== null && next.doctorId !== applied.doctorId) names.push('doctor');
  if (next.visitTypeId !== null && next.visitTypeId !== applied.visitTypeId) names.push('type');

  return names;
}

/**
 * The upper bound is always sent: a bound is what tells the API this is a
 * history search rather than today's queue, which it would otherwise default to.
 */
export function toVisitsParams(filters: PreviousVisitsFilters): VisitsParams {
  return {
    toDate: toDisplayDate(filters.to),
    fromDate: filters.from ? toDisplayDate(filters.from) : undefined,
    query: filters.query || undefined,
    status: filters.status ?? undefined,
    doctorId: filters.doctorId ? Number(filters.doctorId) : undefined,
    visitTypeId: filters.visitTypeId ? Number(filters.visitTypeId) : undefined,
  };
}

/** `16 Jul 2026` from an ISO (`2026-07-16`) or API (`16-07-2026`) date. */
export function formatVisitDay(value: string) {
  const date = /^\d{4}-/.test(value) ? parseISO(value) : parse(value, 'dd-MM-yyyy', new Date());

  return isValid(date) ? format(date, 'd MMM yyyy') : value;
}

export function rangeLabel(filters: DateRange) {
  if (filters.from === null) {
    return `All dates up to ${formatVisitDay(filters.to)}`;
  }

  return filters.from === filters.to
    ? formatVisitDay(filters.from)
    : `${formatVisitDay(filters.from)} – ${formatVisitDay(filters.to)}`;
}
