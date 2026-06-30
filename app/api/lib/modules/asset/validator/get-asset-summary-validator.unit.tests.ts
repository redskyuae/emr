import { describe, expect, it } from 'vitest';

import { validateGetAssetSummary } from './get-asset-summary-validator';

describe('GetAssetSummary validator', () => {
  it('should return the trimmed tenant id on success', () => {
    expect(validateGetAssetSummary('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
  });

  it('should return an error when the tenant id is empty', () => {
    expect(validateGetAssetSummary('   ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
