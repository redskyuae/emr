import assert from 'node:assert/strict';

import { getAssetSummaryQuery } from './get-asset-summary-query';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;

describe('Get Asset summary query', () => {
  test('returns the repository summary for a valid Tenant', async () => {
    const summary = {
      totalAssets: 16,
      portfolioValue: 12_100_000,
      outOfServiceCount: 3,
      byCategory: [
        {
          categoryId: 1,
          name: 'Diagnostic Imaging',
          color: '#2563EB',
          count: 3,
        },
        {
          categoryId: 6,
          name: 'Mobility & Furniture',
          color: '#16A34A',
          count: 0,
        },
      ],
    };

    const result = await getAssetSummaryQuery('tenant-a', {
      getAssetSummary: async (tenantId) => {
        assert.equal(tenantId, 'tenant-a');
        return summary;
      },
    });

    assert.deepEqual(result, { success: true, data: summary });
  });

  test('rejects an empty Tenant ID without reading the repository', async () => {
    let repositoryCalled = false;

    const result = await getAssetSummaryQuery('   ', {
      getAssetSummary: async () => {
        repositoryCalled = true;
        throw new Error('Repository should not be called');
      },
    });

    assert.equal(repositoryCalled, false);
    assert.deepEqual(result, { success: false, errors: ['Tenant ID cannot be empty'] });
  });
});
