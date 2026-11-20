import { describe, expect, it } from 'vitest';

import { consolidatedReportPeriodSchema, toIsoDate } from './consolidated-patient-report-schema';

function messages(input: unknown) {
  const result = consolidatedReportPeriodSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('Consolidated Patient Report schema', () => {
  it('should convert DD-MM-YYYY dates to ISO dates', () => {
    expect(
      consolidatedReportPeriodSchema.parse({ fromDate: ' 01-11-2026 ', toDate: '20-11-2026' })
    ).toEqual({ fromDate: '2026-11-01', toDate: '2026-11-20' });
  });

  it('should accept a single-day period', () => {
    expect(messages({ fromDate: '20-11-2026', toDate: '20-11-2026' })).toEqual([]);
  });

  it('should require both dates', () => {
    expect(messages({})).toEqual(['To date is required', 'From date is required']);
    expect(messages({ fromDate: '  ', toDate: '' })).toEqual([
      'To date is required',
      'From date is required',
    ]);
  });

  it('should reject dates that are not real DD-MM-YYYY dates', () => {
    expect(messages({ fromDate: '2026-11-01', toDate: '31-02-2026' })).toEqual([
      'To date must be in DD-MM-YYYY format',
      'From date must be in DD-MM-YYYY format',
    ]);
  });

  it('should reject a From date after the To date', () => {
    const result = consolidatedReportPeriodSchema.safeParse({
      fromDate: '21-11-2026',
      toDate: '20-11-2026',
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['toDate'],
        message: 'From date must be on or before To date',
      }),
    ]);
  });

  it('should accept 366 days and reject 367', () => {
    expect(messages({ fromDate: '01-01-2028', toDate: '31-12-2028' })).toEqual([]);
    expect(messages({ fromDate: '01-01-2026', toDate: '02-01-2027' })).toEqual([
      'Report period must be at most 366 days',
    ]);
  });

  it('should only convert real calendar dates', () => {
    expect(toIsoDate('29-02-2028')).toBe('2028-02-29');
    expect(toIsoDate('29-02-2026')).toBeUndefined();
    expect(toIsoDate('1-11-2026')).toBeUndefined();
  });
});
