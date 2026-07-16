export type AppointmentSlotContext = {
  toTime: string;
  fromTime: string;
  durationMinutes: number;
};

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generatedSlotTimes(context: AppointmentSlotContext) {
  const start = minutesFromTime(context.fromTime);
  const end = minutesFromTime(context.toTime);
  const slots: string[] = [];

  for (
    let current = start;
    current + context.durationMinutes <= end;
    current += context.durationMinutes
  ) {
    slots.push(timeFromMinutes(current));
  }

  return slots;
}

export function isValidSlotSelection(context: AppointmentSlotContext, selectedSlotTimes: string[]) {
  const available = new Set(generatedSlotTimes(context));

  return selectedSlotTimes.every((slotTime, index) => {
    if (!available.has(slotTime)) {
      return false;
    }

    if (index === 0) {
      return true;
    }

    return (
      minutesFromTime(slotTime) - minutesFromTime(selectedSlotTimes[index - 1]) ===
      context.durationMinutes
    );
  });
}

export function tenantLocalDateTime(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export function isFutureSlotSelection(
  slotDate: string,
  firstSlotTime: string,
  timeZone: string,
  now = new Date()
) {
  const local = tenantLocalDateTime(now, timeZone);
  return `${slotDate}T${firstSlotTime}` > `${local.date}T${local.time}`;
}
