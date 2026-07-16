import { describe, expect, it } from 'vitest';

import {
  generatedSlotTimes,
  isFutureSlotSelection,
  isValidSlotSelection,
} from './appointment-slot';

const context = {
  fromTime: '09:00',
  toTime: '10:00',
  durationMinutes: 15,
};

describe('Appointment slot helpers', () => {
  it('should generate slot start times within the rota window', () => {
    expect(generatedSlotTimes(context)).toEqual(['09:00', '09:15', '09:30', '09:45']);
  });

  it('should accept consecutive selected slots in order', () => {
    expect(isValidSlotSelection(context, ['09:00', '09:15', '09:30'])).toBe(true);
  });

  it('should reject gaps and slots outside the rota window', () => {
    expect(isValidSlotSelection(context, ['09:00', '09:30'])).toBe(false);
    expect(isValidSlotSelection(context, ['10:00'])).toBe(false);
  });

  it('should compare future slot starts in the tenant time zone', () => {
    const now = new Date('2026-07-16T03:29:00.000Z');

    expect(isFutureSlotSelection('2026-07-16', '09:00', 'Asia/Kolkata', now)).toBe(true);
    expect(isFutureSlotSelection('2026-07-16', '08:59', 'Asia/Kolkata', now)).toBe(false);
  });
});
