import { describe, expect, it } from 'vitest';

import { validateGetVisitStatusCounts } from './get-visit-status-counts-validator';

describe('validateGetVisitStatusCounts', () => {
  it('should reject a blank tenant id', () => {
    expect(validateGetVisitStatusCounts({ visitDate: '16-07-2026' }, '  ')).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });

  it('should reject a missing visit date', () => {
    expect(validateGetVisitStatusCounts(undefined, 'tenant-1')).toEqual({
      success: false,
      errors: ['Visit date is required'],
    });
  });

  it('should collect tenant and filter errors together', () => {
    const result = validateGetVisitStatusCounts({ visitDate: 'today' }, '');

    expect(result).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty', 'Visit date must be in DD-MM-YYYY format'],
    });
  });

  it('should return the ISO visit date, Doctor and tenant on success', () => {
    expect(
      validateGetVisitStatusCounts({ visitDate: '16-07-2026', doctorId: '3' }, 'tenant-1')
    ).toEqual({
      success: true,
      data: { visitDate: '2026-07-16', doctorId: 3, tenantId: 'tenant-1' },
    });
  });
});
