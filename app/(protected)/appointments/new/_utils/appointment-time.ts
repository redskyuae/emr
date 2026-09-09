function timeToMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function getDurationMinutes(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
}

export function addMinutesToTime(startTime: string, duration: number) {
  const start = timeToMinutes(startTime);
  if (start === null) return '';
  const end = start + duration;
  const hours = Math.floor(end / 60);
  const minutes = end % 60;
  if (hours > 23) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getSlotTimes(startTime: string, endTime: string, interval: number) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start || interval <= 0) return [];

  const slots: string[] = [];
  for (let time = start; time < end; time += interval) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }
  return slots;
}
