import { describe, expect, it } from 'vitest';

import { isValidPeriod, thisMonthPeriod, toApiDate } from './consolidated-report-period';

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

  it('should turn an ISO date into the DD-MM-YYYY the API takes', () => {
    expect(toApiDate('2026-11-03')).toBe('03-11-2026');
  });
});
