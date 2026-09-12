import { addMinutesToTime } from './appointment-time';

type SlotRota = {
  duration: number;
  slots: Array<{ time: string; status: 'Available' | 'Booked' }>;
};

export function getAvailableStartTimes(rota: SlotRota) {
  return rota.slots.filter((slot) => slot.status === 'Available').map((slot) => slot.time);
}

export function getAvailableEndTimes(rota: SlotRota, startTime: string) {
  const startIndex = rota.slots.findIndex((slot) => slot.time === startTime);

  if (startIndex < 0) return [];

  const endTimes: string[] = [];
  let expectedTime = startTime;

  for (const slot of rota.slots.slice(startIndex)) {
    if (slot.time !== expectedTime || slot.status !== 'Available') break;

    expectedTime = addMinutesToTime(slot.time, rota.duration);
    endTimes.push(expectedTime);
  }

  return endTimes;
}
