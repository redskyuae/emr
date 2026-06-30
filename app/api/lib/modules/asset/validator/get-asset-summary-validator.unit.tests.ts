import { describe, expect, it } from 'vitest';

import { validateGetAssetSummary } from './get-asset-summary-validator';

describe('GetAssetSummary validator', () => {
  it('should trim the tenant id on success', () => {
    expect(validateGetAssetSummary('  tenant-1  ')).toEqual({ success: true, data: 'tenant-1' });
  });

  it('should return exactly { success: false, errors } when the tenant id is empty', () => {
    expect(validateGetAssetSummary('   ')).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
