import { describe, expect, it } from 'vitest';

import { consolidatedReportFormSchema } from './consolidated-report-form-schema';

const valid = { patientId: '7', from: '2026-11-01', to: '2026-11-20' };

function messages(values: Record<string, string>) {
  const result = consolidatedReportFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('consolidatedReportFormSchema', () => {
  it('should accept a Patient and a period', () => {
    expect(consolidatedReportFormSchema.parse(valid)).toEqual(valid);
  });

  it('should accept a single-day period', () => {
    expect(messages({ ...valid, to: valid.from })).toEqual([]);
  });

  it('should require a Patient', () => {
    expect(messages({ ...valid, patientId: '' })).toEqual(['Choose a Patient']);
  });

  it('should require both dates', () => {
    expect(messages({ ...valid, from: '', to: '' })).toEqual([
      'To date is required',
      'From date is required',
    ]);
  });

  it('should accept 366 days and reject 367', () => {
    expect(messages({ ...valid, from: '2028-01-01', to: '2028-12-31' })).toEqual([]);
    expect(messages({ ...valid, from: '2026-01-01', to: '2027-01-02' })).toEqual([
      'Report period must be at most 366 days',
    ]);
  });

  it('should reject a From date after the To date on the To field', () => {
    const result = consolidatedReportFormSchema.safeParse({ ...valid, from: '2026-11-21' });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['to'],
        message: 'From date must be on or before To date',
      }),
    ]);
  });
});
