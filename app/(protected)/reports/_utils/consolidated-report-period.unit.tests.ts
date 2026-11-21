import { describe, expect, it } from 'vitest';

import {
  isValidPeriod,
  periodDays,
  thisMonthPeriod,
  toApiDate,
} from './consolidated-report-period';

describe('consolidated report period', () => {
  it('should run this month from the first to today', () => {
    expect(thisMonthPeriod(new Date(2026, 10, 20))).toEqual({
      from: '2026-11-01',
      to: '2026-11-20',
    });
  });

  it('should accept a period of real ISO dates with From on or before To', () => {
    expect(isValidPeriod({ from: '2026-11-01', to: '2026-11-20' })).toBe(true);
    expect(isValidPeriod({ from: '2026-11-20', to: '2026-11-20' })).toBe(true);
  });

  it('should reject a missing, malformed, impossible or reversed period', () => {
    expect(isValidPeriod({ from: null, to: '2026-11-20' })).toBe(false);
    expect(isValidPeriod({ from: '2026-11-01', to: '20/11/2026' })).toBe(false);
    expect(isValidPeriod({ from: '2026-02-30', to: '2026-03-01' })).toBe(false);
    expect(isValidPeriod({ from: '2026-11-21', to: '2026-11-20' })).toBe(false);
  });

  it('should count the days in a period, both ends included', () => {
    expect(periodDays({ from: '2026-11-20', to: '2026-11-20' })).toBe(1);
    expect(periodDays({ from: '2026-11-01', to: '2026-11-20' })).toBe(20);
    expect(periodDays({ from: '2026-03-28', to: '2026-04-03' })).toBe(7);
    expect(periodDays({ from: '2024-01-01', to: '2024-12-31' })).toBe(366);
  });

  it('should turn an ISO date into the DD-MM-YYYY the API takes', () => {
    expect(toApiDate('2026-11-03')).toBe('03-11-2026');
  });
});
