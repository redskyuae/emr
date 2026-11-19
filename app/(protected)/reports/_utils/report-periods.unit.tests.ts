import { describe, expect, it } from 'vitest';

import { defaultSummaryMonth, defaultVisitRegisterPeriod } from './report-periods';

describe('Report default periods', () => {
  it('should default the Visit Register to the first of this month through today', () => {
    expect(defaultVisitRegisterPeriod(new Date(2026, 10, 19, 13, 22))).toEqual({
      from: '2026-11-01',
      to: '2026-11-19',
    });
  });

  it('should default the Visit Register to a single day on the first of the month', () => {
    expect(defaultVisitRegisterPeriod(new Date(2026, 0, 1, 0, 5))).toEqual({
      from: '2026-01-01',
      to: '2026-01-01',
    });
  });

  it('should default the Doctor-wise Visit Summary to this month', () => {
    expect(defaultSummaryMonth(new Date(2026, 10, 19))).toBe('2026-11');
    expect(defaultSummaryMonth(new Date(2026, 11, 31, 23, 59))).toBe('2026-12');
  });
});
