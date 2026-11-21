// Durations sent with lifecycle Analytics Events. Every duration is a whole number of elapsed
// minutes or days, rounded down and never negative; only an offset against a booked start may be
// negative. Calendar days are counted on the Tenant's own clock (ADR 0026).

import { tenantLocalDateTime } from '@/app/api/lib/modules/appointment/schemas/appointment-slot';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function elapsed(from: Date, to: Date, unitMs: number) {
  const value = Math.floor((to.getTime() - from.getTime()) / unitMs);

  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Whole minutes from `from` to `to`; 0 when `to` is earlier. */
export function minutesBetween(from: Date, to: Date) {
  return elapsed(from, to, MINUTE_MS);
}

/** Whole days from `from` to `to`; 0 when `to` is earlier. */
export function daysBetween(from: Date, to: Date) {
  return elapsed(from, to, DAY_MS);
}

function isoDayNumber(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);

  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function minutesOfDay(time: string) {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

/**
 * Calendar days from the Tenant's today to an Appointment's `DD-MM-YYYY` slot date: 0 for today,
 * 1 for tomorrow. A date already past counts as 0.
 */
export function leadTimeDays(slotDate: string, timeZone: string, now = new Date()) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(slotDate);

  if (!match) {
    return 0;
  }

  const [, day, month, year] = match;
  const today = tenantLocalDateTime(now, timeZone).date;
  const days = isoDayNumber(`${year}-${month}-${day}`) - isoDayNumber(today);

  return Number.isFinite(days) ? Math.max(0, days) : 0;
}

/**
 * Signed whole minutes between an `HH:mm` start on the Tenant's clock and the moment `at`, on the
 * same day: negative when `at` is before the start (early), positive when after (late).
 */
export function minutesVsLocalStart(at: Date, startTime: string, timeZone: string) {
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return undefined;
  }

  const local = tenantLocalDateTime(at, timeZone).time;

  return minutesOfDay(local) - minutesOfDay(startTime);
}
