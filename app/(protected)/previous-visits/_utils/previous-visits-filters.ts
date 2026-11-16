import { format, isValid, parse, parseISO } from 'date-fns';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { VisitsParams } from '@/app/queries/visits/useVisits';
import { VISIT_STATUS_FILTERS, toDisplayDate } from '../../visits/_utils/visit-status';

/** Filters as they appear in the URL: ISO dates for `<input type="date">`, ids as strings. */
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

/** How many filters differ from a fresh page, for the Reset button badge. */
export function countActiveFilters(filters: PreviousVisitsFilters, today: Date) {
  const fallback = defaultRange(today);
  const rangeChanged = filters.from !== fallback.from || filters.to !== fallback.to;

  return [
    rangeChanged,
    filters.query !== '',
    filters.status !== null,
    filters.doctorId !== null,
    filters.visitTypeId !== null,
  ].filter(Boolean).length;
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
