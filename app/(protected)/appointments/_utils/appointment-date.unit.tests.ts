import { describe, expect, it } from 'vitest';

import { todayDisplayDate, tomorrowDisplayDate } from './appointment-date';

describe('Appointment date utilities', () => {
  it('should format today and tomorrow in display-date format', () => {
    const now = new Date(2026, 9, 13, 12);

    expect(todayDisplayDate(now)).toBe('13-10-2026');
    expect(tomorrowDisplayDate(now)).toBe('14-10-2026');
  });

  it('should advance tomorrow across month and year boundaries', () => {
    expect(tomorrowDisplayDate(new Date(2026, 11, 31, 12))).toBe('01-01-2027');
  });
});
