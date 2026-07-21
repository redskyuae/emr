export function todayDisplayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
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
