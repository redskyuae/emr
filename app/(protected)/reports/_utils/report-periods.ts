import { format, startOfMonth } from 'date-fns';

/** The Visit Register opens on this month to date, as ISO dates for `<input type="date">`. */
export function defaultVisitRegisterPeriod(today: Date) {
  return {
    to: format(today, 'yyyy-MM-dd'),
    from: format(startOfMonth(today), 'yyyy-MM-dd'),
  };
}

/** The Doctor-wise Visit Summary opens on this month, for `<input type="month">`. */
export function defaultSummaryMonth(today: Date) {
  return format(today, 'yyyy-MM');
}
