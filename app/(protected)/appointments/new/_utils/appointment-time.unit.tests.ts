import { describe, expect, it } from 'vitest';
import { addMinutesToTime, getDurationMinutes, getSlotTimes } from './appointment-time';

describe('Appointment time', () => {
  it('should calculate a variable duration', () => {
    expect(getDurationMinutes('09:15', '10:45')).toBe(90);
  });

  it('should return zero when the range is incomplete or invalid', () => {
    expect(getDurationMinutes('', '10:45')).toBe(0);
    expect(getDurationMinutes('11:00', '10:45')).toBe(0);
  });

  it('should add minutes to a start time', () => {
    expect(addMinutesToTime('09:45', 60)).toBe('10:45');
  });

  it('should derive DoctorSlots from the selected time range', () => {
    expect(getSlotTimes('09:00', '10:00', 15)).toEqual(['09:00', '09:15', '09:30', '09:45']);
  });
});
