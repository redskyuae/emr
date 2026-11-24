import { format, parseISO, subDays } from 'date-fns';

import { tenantLocalDateTime } from '@/app/api/lib/modules/appointment/schemas/appointment-slot';

// A fresh User Audit page covers the last 30 days, today included.
const DEFAULT_RANGE_DAYS = 30;

export type UserAuditRange = { from: string; to: string };

/** A real calendar date as YYYY-MM-DD; `2026-02-30` and `0000-01-01` are not. */
function isIsoDate(value: string | null): value is string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  // Date rolls an impossible day over (30 Feb is 2 Mar), so it must round-trip.
  const parsed = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() >= 1 &&
    parsed.toISOString().startsWith(value)
  );
}

/** Today in the Tenant's time zone (the browser's until it is known), as YYYY-MM-DD. */
export function tenantTodayIso(now: Date, timeZone: string | undefined) {
  return timeZone ? tenantLocalDateTime(now, timeZone).date : format(now, 'yyyy-MM-dd');
}

export function defaultUserAuditRange(todayIso: string): UserAuditRange {
  return {
    to: todayIso,
    from: format(subDays(parseISO(todayIso), DEFAULT_RANGE_DAYS - 1), 'yyyy-MM-dd'),
  };
}

/**
 * The range in the URL, or the default. A malformed or inverted range falls back
 * to the default, so a hand-edited link still shows something sensible.
 */
export function resolveUserAuditRange(
  params: { from: string | null; to: string | null },
  todayIso: string
): UserAuditRange {
  const fallback = defaultUserAuditRange(todayIso);
  const from = isIsoDate(params.from) ? params.from : fallback.from;
  const to = isIsoDate(params.to) ? params.to : fallback.to;

  return from <= to ? { from, to } : fallback;
}

export function isDefaultUserAuditRange(range: UserAuditRange, todayIso: string) {
  const fallback = defaultUserAuditRange(todayIso);
  return range.from === fallback.from && range.to === fallback.to;
}

/** `23 Oct – 22 Nov 2026`. */
export function userAuditRangeLabel(range: UserAuditRange) {
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const sameYear = from.getFullYear() === to.getFullYear();

  return range.from === range.to
    ? format(to, 'd MMM yyyy')
    : `${format(from, sameYear ? 'd MMM' : 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
}
