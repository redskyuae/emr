import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAssetSummaryQuery } from './get-asset-summary-query';

const summary = {
  totalAssets: 16,
  portfolioValue: 12_100_000,
  outOfServiceCount: 3,
  byCategory: [
    { categoryId: 1, name: 'Diagnostic Imaging', color: '#2563EB', count: 3 },
    { categoryId: 6, name: 'Mobility & Furniture', color: '#16A34A', count: 0 },
  ],
};

describe('GetAssetSummary query', () => {
  const getAssetSummary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getAssetSummary.mockResolvedValue(summary);
  });

  it('should normalize the tenant id before calling the repository', async () => {
    const result = await getAssetSummaryQuery('  tenant-a  ', { getAssetSummary });
    expect(getAssetSummary).toHaveBeenCalledWith('tenant-a');
    expect(result).toEqual({ success: true, data: summary });
  });

  it('should reject an empty tenant id without reading the repository', async () => {
    const result = await getAssetSummaryQuery('   ', { getAssetSummary });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(getAssetSummary).not.toHaveBeenCalled();
  });
});
