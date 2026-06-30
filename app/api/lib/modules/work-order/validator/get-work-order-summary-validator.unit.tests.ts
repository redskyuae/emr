import { describe, expect, it } from 'vitest';

import { validateGetWorkOrderSummary } from './get-work-order-summary-validator';

describe('GetWorkOrderSummary validator', () => {
  it('should trim the tenant id on success', () => {
    expect(validateGetWorkOrderSummary('  tenant-1  ')).toEqual({
      success: true,
      data: 'tenant-1',
    });
  });

  it('should return exactly { success: false, errors } when the tenant id is empty', () => {
    expect(validateGetWorkOrderSummary('   ')).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
