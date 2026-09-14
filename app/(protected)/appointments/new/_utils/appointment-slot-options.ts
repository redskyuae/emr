import { addMinutesToTime, getDurationMinutes } from './appointment-time';

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

export function getRotaScheduleOptions(rota: SlotRota, startTime: string) {
  const endTimes = getAvailableEndTimes(rota, startTime);

  return {
    startTimes: getAvailableStartTimes(rota),
    endTimes,
    availableDurations: endTimes.map((time) => getDurationMinutes(startTime, time)),
  };
}

export function getRecommendedEndTime(
  rota: SlotRota,
  startTime: string,
  recommendedDuration: number
) {
  const endTimes = getAvailableEndTimes(rota, startTime);
  const recommendedEndTime = addMinutesToTime(startTime, recommendedDuration);

  return endTimes.includes(recommendedEndTime) ? recommendedEndTime : (endTimes[0] ?? '');
}
