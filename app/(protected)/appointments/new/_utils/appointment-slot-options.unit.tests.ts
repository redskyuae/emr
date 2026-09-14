import { describe, expect, it } from 'vitest';

import {
  getAvailableEndTimes,
  getAvailableStartTimes,
  getRecommendedEndTime,
  getRotaScheduleOptions,
} from './appointment-slot-options';

const rota = {
  duration: 20,
  slots: [
    { time: '09:00', status: 'Available' as const },
    { time: '09:20', status: 'Available' as const },
    { time: '09:40', status: 'Booked' as const },
    { time: '10:00', status: 'Available' as const },
  ],
};

describe('Appointment slot options', () => {
  it('should expose only available DoctorSlot start times', () => {
    expect(getAvailableStartTimes(rota)).toEqual(['09:00', '09:20', '10:00']);
  });

  it('should stop end-time choices before a booked DoctorSlot', () => {
    expect(getAvailableEndTimes(rota, '09:00')).toEqual(['09:20', '09:40']);
  });

  it('should not bridge a gap in the DoctorRota', () => {
    expect(
      getAvailableEndTimes(
        {
          duration: 20,
          slots: [
            { time: '09:00', status: 'Available' },
            { time: '09:40', status: 'Available' },
          ],
        },
        '09:00'
      )
    ).toEqual(['09:20']);
  });

  it('should derive every schedule choice from the selected DoctorRota', () => {
    expect(getRotaScheduleOptions(rota, '09:00')).toEqual({
      startTimes: ['09:00', '09:20', '10:00'],
      endTimes: ['09:20', '09:40'],
      availableDurations: [20, 40],
    });
  });

  it('should fall back to the first valid end time when the recommended duration crosses a booked slot', () => {
    expect(getRecommendedEndTime(rota, '09:00', 60)).toBe('09:20');
  });
});
