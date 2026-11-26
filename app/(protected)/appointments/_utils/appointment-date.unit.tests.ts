import { describe, expect, it } from 'vitest';

import {
  fromDateParamToDisplayDate,
  todayDisplayDate,
  tomorrowDisplayDate,
} from './appointment-date';

describe('Appointment date utilities', () => {
  it('should format today and tomorrow in display-date format', () => {
    const now = new Date(2026, 9, 13, 12);

    expect(todayDisplayDate(now)).toBe('13-10-2026');
    expect(tomorrowDisplayDate(now)).toBe('14-10-2026');
  });

  it('should advance tomorrow across month and year boundaries', () => {
    expect(tomorrowDisplayDate(new Date(2026, 11, 31, 12))).toBe('01-01-2027');
  });

  it('should derive today and tomorrow from the same Tenant-local calendar date', () => {
    const now = new Date('2026-10-13T02:00:00.000Z');

    expect(todayDisplayDate(now, 'America/Los_Angeles')).toBe('12-10-2026');
    expect(tomorrowDisplayDate(now, 'America/Los_Angeles')).toBe('13-10-2026');
  });

  it('should convert a From Date URL value to the API display-date format', () => {
    expect(fromDateParamToDisplayDate('2026-11-27')).toBe('27-11-2026');
    expect(fromDateParamToDisplayDate('2025-01-05')).toBe('05-01-2025');
  });

  it('should ignore a missing, malformed or impossible From Date URL value', () => {
    expect(fromDateParamToDisplayDate(null)).toBeUndefined();
    expect(fromDateParamToDisplayDate('')).toBeUndefined();
    expect(fromDateParamToDisplayDate('27-11-2026')).toBeUndefined();
    expect(fromDateParamToDisplayDate('2026-02-30')).toBeUndefined();
    expect(fromDateParamToDisplayDate('2026-13-01')).toBeUndefined();
  });
});
