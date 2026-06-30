import { describe, expect, it } from 'vitest';

import { validateGetWorkOrderSummary } from './get-work-order-summary-validator';

describe('GetWorkOrderSummary validator', () => {
  it('should return the trimmed tenant id on success', () => {
    expect(validateGetWorkOrderSummary('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
  });

  it('should return an error when the tenant id is empty', () => {
    expect(validateGetWorkOrderSummary('   ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
