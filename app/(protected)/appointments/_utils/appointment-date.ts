function displayDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
}

export function todayDisplayDate(now = new Date()) {
  return displayDate(now);
}

export function tomorrowDisplayDate(now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return displayDate(tomorrow);
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
