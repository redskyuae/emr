import { differenceInCalendarDays, format, isValid, parseISO, startOfMonth } from 'date-fns';

type Period = { from: string; to: string };

const ISO_DATE = 'yyyy-MM-dd';

/** This month to date, as ISO dates for `<input type="date">`. */
export function thisMonthPeriod(today: Date): Period {
  return { from: format(startOfMonth(today), ISO_DATE), to: format(today, ISO_DATE) };
}

/** Whether both ends are real `yyyy-MM-dd` dates, From on or before To (e.g. read from a URL). */
export function isValidPeriod(period: { from: string | null; to: string | null }) {
  const isIsoDate = (value: string | null): value is string =>
    !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));

  return isIsoDate(period.from) && isIsoDate(period.to) && period.from <= period.to;
}

/** How many days a valid period covers, counting both ends (a single day is 1). */
export function periodDays(period: Period) {
  return differenceInCalendarDays(parseISO(period.to), parseISO(period.from)) + 1;
}

/** An ISO `yyyy-MM-dd` date as the `DD-MM-YYYY` the API takes. */
export function toApiDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}
