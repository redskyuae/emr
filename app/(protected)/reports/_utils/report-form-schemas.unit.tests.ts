import { describe, expect, it } from 'vitest';

import {
  doctorVisitSummaryReportFormSchema,
  visitRegisterReportFormSchema,
} from './report-form-schemas';

function issueMessages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map(({ message }) => message) ?? [];
}

describe('Visit Register report form schema', () => {
  it('should accept a range whose From date is on or before its To date', () => {
    expect(
      visitRegisterReportFormSchema.safeParse({ from: '2026-11-01', to: '2026-11-19' }).success
    ).toBe(true);
    expect(
      visitRegisterReportFormSchema.safeParse({ from: '2026-11-19', to: '2026-11-19' }).success
    ).toBe(true);
  });

  it('should require both the From and To dates', () => {
    const result = visitRegisterReportFormSchema.safeParse({ from: '', to: '' });

    expect(issueMessages(result)).toEqual(
      expect.arrayContaining(['From date is required', 'To date is required'])
    );
  });

  it('should reject a From date after the To date on the To field', () => {
    const result = visitRegisterReportFormSchema.safeParse({
      from: '2026-11-20',
      to: '2026-11-19',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['to'],
        message: 'From date must be on or before To date',
      }),
    ]);
  });
});

describe('Doctor-wise Visit Summary report form schema', () => {
  it('should accept a month', () => {
    expect(doctorVisitSummaryReportFormSchema.safeParse({ month: '2026-11' }).success).toBe(true);
  });

  it('should require the month', () => {
    const result = doctorVisitSummaryReportFormSchema.safeParse({ month: '' });

    expect(issueMessages(result)).toEqual(['Month is required']);
  });
});
