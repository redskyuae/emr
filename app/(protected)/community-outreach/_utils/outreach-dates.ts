const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseIso(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);

  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDaysIso(iso: string, days: number) {
  const { year, month, day } = parseIso(iso);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return shifted.toISOString().slice(0, 10);
}

export function formatShortDate(iso: string) {
  const { month, day } = parseIso(iso);

  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]}`;
}

export function formatLongDate(iso: string) {
  return `${formatShortDate(iso)} ${parseIso(iso).year}`;
}

export function formatWeekday(iso: string) {
  return WEEKDAYS[parseIso(iso).weekday];
}

export function formatTime(time: string) {
  if (!time) {
    return '';
  }

  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';

  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function daysBetween(fromIso: string, toIso: string) {
  const from = parseIso(fromIso);
  const to = parseIso(toIso);

  return Math.round(
    (Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) /
      86_400_000
  );
}
