function calendarDateParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function displayDate({ year, month, day }: ReturnType<typeof calendarDateParts>) {
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  return `${paddedDay}-${paddedMonth}-${year}`;
}

export function todayDisplayDate(now = new Date(), timeZone?: string) {
  return displayDate(calendarDateParts(now, timeZone));
}

export function tomorrowDisplayDate(now = new Date(), timeZone?: string) {
  const { year, month, day } = calendarDateParts(now, timeZone);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));

  return displayDate({
    year: tomorrow.getUTCFullYear(),
    month: tomorrow.getUTCMonth() + 1,
    day: tomorrow.getUTCDate(),
  });
}

export function toDateInputValue(displayDate: string) {
  const [day, month, year] = displayDate.split('-');

  if (!day || !month || !year) {
    return '';
  }

  return `${year}-${month}-${day}`;
}

export function toDisplayDate(inputDate: string) {
  const [year, month, day] = inputDate.split('-');

  if (!day || !month || !year) {
    return '';
  }

  return `${day}-${month}-${year}`;
}
